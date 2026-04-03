const {
    Event,
    TicketType,
    TicketBundles,
    TicketBundleItem,
    CreatorFinanceSettings,
    SystemFinanceSettings,
    Creator,
    sequelize
} = require("../../../models");

const { Op } = require("sequelize");


/* =====================================================
   CALCULATE FINANCE
===================================================== */
function calculateFinance({

    price,
    adminFeeType,
    adminFeeValue,
    taxRate,

    adminFeeIncluded,
    taxIncluded

}) {

    let adminFee = 0;
    let tax = 0;

    /* =====================
       HITUNG ADMIN FEE
    ===================== */

    if (adminFeeType === "flat") {

        adminFee = Number(adminFeeValue);

    }

    if (adminFeeType === "percent") {

        adminFee =
            Number(price) *
            (Number(adminFeeValue) / 100);

    }


    /* =====================
       HITUNG TAX
    ===================== */

    tax =
        Number(price) *
        (Number(taxRate) / 100);


    /* =====================
       SIAPA YANG BAYAR?
    ===================== */

    let organizerRevenue = Number(price);

    if (!adminFeeIncluded) {

        organizerRevenue -= adminFee;

    }

    if (!taxIncluded) {

        organizerRevenue -= tax;

    }


    /* =====================
       TOTAL YANG DIBAYAR BUYER
    ===================== */

    let buyerPay = Number(price);

    if (adminFeeIncluded) {

        buyerPay += adminFee;

    }

    if (taxIncluded) {

        buyerPay += tax;

    }


    return {

        ticketPrice: Number(price),

        buyerPay,

        adminFee,

        tax,

        organizerRevenue,

        adminFeePaidBy:
            adminFeeIncluded
                ? "buyer"
                : "organizer",

        taxPaidBy:
            taxIncluded
                ? "buyer"
                : "organizer"

    };

}

/* =====================================================
   LIST DRAFT EVENTS
===================================================== */
exports.listDraftEvents = async ({
    page = 1,
    perPage = 10,
    search = ""
}) => {

    const offset =
        (page - 1) * perPage;

    const { rows, count } =
        await Event.findAndCountAll({

            where: {

                status: "draft",

                name: {
                    [Op.like]:
                        `%${search}%`
                }

            },

            include: [

                {

                    model: Creator,

                    as: "creators",

                    attributes: [
                        "id",
                        "name"
                    ]

                }

            ],

            limit: Number(perPage),

            offset,

            order: [
                ["created_at", "DESC"]
            ]

        });


    return {

        data: rows,

        meta: {

            page: Number(page),

            perPage: Number(perPage),

            total: count,

            totalPages:
                Math.ceil(
                    count / perPage
                )

        }

    };

};


/* =====================================================
   DETAIL EVENT + FINANCE SIMULATION
===================================================== */

exports.getEventDetail = async (eventId) => {

    const event = await Event.findByPk(eventId, {

        include: [

            {
                model: Creator,
                as: "creators",
                attributes: ["id", "name"]
            },

            {
                model: TicketType,
                as: "ticket_types"
            },

            {
                model: TicketBundles,
                as: "ticket_bundles",
                include: [
                    {
                        model: TicketBundleItem,
                        as: "items"
                    }
                ]
            }

        ]

    });


    if (!event)
        throw new Error("Event not found");


    /* =============================
       FINANCE SETTING
    ============================== */

    const financeSetting =
        await CreatorFinanceSettings.findOne({

            where: {
                creator_id: event.creator_id
            }

        });


    const systemFinance =
        await SystemFinanceSettings.findOne();


    const taxRate =
        systemFinance?.tax_rate || 11;


    const adminFeeType =
        financeSetting?.admin_fee_type || "percent";


    const adminFeeValue =
        financeSetting?.admin_fee_value || 5;


    /* =============================
       GLOBAL SUMMARY
    ============================== */

    let globalSummary = {

        totalStock: 0,

        totalBuyerPay: 0,

        totalAdminFee: 0,

        totalTax: 0,

        totalOrganizerRevenue: 0

    };


    /* =============================
       TICKET FINANCE
    ============================== */

    const ticketFinance =
        event.ticket_types.map(ticket => {

            const finance =
                calculateFinance({

                    price:
                        Number(ticket.price),

                    adminFeeType,

                    adminFeeValue,

                    taxRate,

                    adminFeeIncluded:
                        ticket.admin_fee_included,

                    taxIncluded:
                        ticket.tax_included

                });


            /* =============================
               SIMULASI SOLD OUT
            ============================== */

            const totalStock =
                Number(ticket.total_stock || 0);


            const simulation = {

                totalStock,

                buyerPayTotal:
                    finance.buyerPay * totalStock,

                adminFeeTotal:
                    finance.adminFee * totalStock,

                taxTotal:
                    finance.tax * totalStock,

                organizerRevenueTotal:
                    finance.organizerRevenue * totalStock

            };


            /* =============================
               ACCUMULATE GLOBAL
            ============================== */

            globalSummary.totalStock
                += totalStock;

            globalSummary.totalBuyerPay
                += simulation.buyerPayTotal;

            globalSummary.totalAdminFee
                += simulation.adminFeeTotal;

            globalSummary.totalTax
                += simulation.taxTotal;

            globalSummary.totalOrganizerRevenue
                += simulation.organizerRevenueTotal;


            return {

                ...ticket.toJSON(),

                finance,

                simulation

            };

        });


    /* =============================
       BUNDLE (TANPA FEE SIMULASI)
    ============================== */

    const bundleFinance =
        event.ticket_bundles.map(bundle => ({

            ...bundle.toJSON(),

            finance: {

                ticketPrice:
                    Number(bundle.price)

            }

        }));


    return {

        ...event.toJSON(),

        ticketFinance,

        bundleFinance,

        financeSetting: {

            adminFeeType,

            adminFeeValue,

            taxRate

        },

        summary: globalSummary

    };

};


/* =====================================================
   PUBLISH EVENT
===================================================== */
exports.publishEvent =
    async (eventId) => {

        return sequelize.transaction(

            async (t) => {

                const event =
                    await Event.findByPk(

                        eventId,

                        {

                            transaction: t,

                            lock: true

                        }

                    );


                if (!event)
                    throw new Error(
                        "Event not found"
                    );


                if (
                    event.status !== "draft"
                ) {

                    throw new Error(
                        "Event already published"
                    );

                }


                event.status =
                    "published";


                await event.save({

                    transaction: t

                });


                return event;

            }

        );

    };