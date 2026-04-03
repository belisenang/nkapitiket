const {
    sequelize,
    CustomerUser,
    Order,
    OrderItem,
    Payment,
    TicketType,
    Event,
    Ticket,
    TicketBundles,
    TicketBundleItem
} = require("../../../../models");

const { QueryTypes, Op } = require("sequelize");
const { maskEmail } = require("../../../../utils/maskEmail");
const { maskPhone } = require("../../../../utils/maskPhone");
const { toWIB } = require("../../../utils/wib");

function normalizePaymentStatus(order, pay) {

    if (pay?.status)
        return pay.status.toUpperCase();

    return order.status.toUpperCase();

}
module.exports = {
    async getDashboardProfile(userId) {
        try {
            const profile = await CustomerUser.findOne({
                where: { id: userId },
                attributes: ['id', 'full_name', 'email', 'phone', 'photo_url']
            });
            return profile;
        } catch (err) {
            throw new Error("Failed to retrieve profile: " + err.message);
        }
    },

    async updateDashboardProfile(userId, data) {
        const transaction = await sequelize.transaction();
        try {
            const user = await CustomerUser.findByPk(userId, { transaction });
            if (!user) {
                throw new Error("User not found");
            }
            await user.update({
                full_name: data.full_name,
                phone: data.phone,
                photo_url: data.image || user.photo_url
            }, { transaction });
            await transaction.commit();
            return user;
        } catch (err) {
            await transaction.rollback();
            throw new Error("Failed to update profile: " + err.message);
        }
    },

    async getPaginationOrders({
        page = 1,
        perPage = 10,
        search,
        status,
        customer_id,
        event_id,
        payment_method,
        start_date,
        end_date
    }) {

        // prevent NaN
        const safePage =
            Number(page) > 0
                ? Number(page)
                : 1;

        const limit =
            Number(perPage) > 0
                ? Number(perPage)
                : 10;

        const offset =
            (safePage - 1) * limit;

        const replacements = {

            customer_id,

            limit,
            offset,

            search:
                search
                    ? `%${search}%`
                    : null,

            status:
                status && status !== "ALL"
                    ? status.toLowerCase()
                    : null,

            event_id:
                event_id && event_id !== "ALL"
                    ? event_id
                    : null,

            payment_method:
                payment_method && payment_method !== "ALL"
                    ? payment_method
                    : null,

            start_date:
                start_date || null,

            end_date:
                end_date || null
        };


        const baseWhere = `

        o.customer_id = :customer_id

        ${status && status !== "ALL"
                ? "AND o.status = :status"
                : ""}

        ${payment_method
                ? "AND p.payment_method = :payment_method"
                : ""}

        ${start_date && end_date
                ? `
            AND o.created_at BETWEEN
            CONCAT(:start_date,' 00:00:00')
            AND CONCAT(:end_date,' 23:59:59')
            `
                : ""}

    `;


        const searchWhere = search
            ? `

        AND (

            o.code_order LIKE :search
            OR o.customer_name LIKE :search
            OR o.customer_email LIKE :search
            OR o.customer_phone LIKE :search

            OR e.name LIKE :search
            OR tt.name LIKE :search
            OR tb.name LIKE :search
            OR t.ticket_code LIKE :search

        )

        `
            : "";


        const eventFilter = event_id
            ? "AND x.event_id = :event_id"
            : "";


        const sql = `

    SELECT
        o.id,
        o.code_order,
        o.customer_name,
        o.customer_email,
        o.customer_phone,
        o.status,
        o.created_at,

        o.buyer_pay_total,
        o.organizer_net_total,

        p.payment_method,
        p.status as payment_status,
        p.amount,
        p.paid_at,

        GROUP_CONCAT(DISTINCT e.name) as event_names,

        COALESCE(SUM(oi.quantity),0) as total_ticket_qty

    FROM orders o

    JOIN (
        SELECT oi.order_id, tt.event_id
        FROM order_items oi
        JOIN ticket_types tt
            ON tt.id = oi.ticket_type_id

        UNION

        SELECT oi.order_id, tb.event_id
        FROM order_items oi
        JOIN ticket_bundles tb
            ON tb.id = oi.bundle_id

    ) x
        ON x.order_id = o.id

    LEFT JOIN order_items oi
        ON oi.order_id = o.id

    LEFT JOIN ticket_types tt
        ON tt.id = oi.ticket_type_id

    LEFT JOIN ticket_bundles tb
        ON tb.id = oi.bundle_id

    LEFT JOIN events e
        ON e.id = COALESCE(tt.event_id, tb.event_id)

    LEFT JOIN tickets t
        ON t.order_item_id = oi.id

    LEFT JOIN payments p
        ON p.order_id = o.id

    WHERE
        ${baseWhere}
        ${eventFilter}
        ${searchWhere}

    GROUP BY o.id

    ORDER BY o.created_at DESC

    LIMIT :limit
    OFFSET :offset

    `;


        const rows =
            await sequelize.query(sql, {
                replacements,
                type: QueryTypes.SELECT
            });


        // count
        const countSql = `

    SELECT COUNT(DISTINCT o.id) as total

    FROM orders o

    JOIN (
        SELECT oi.order_id, tt.event_id
        FROM order_items oi
        JOIN ticket_types tt
            ON tt.id = oi.ticket_type_id

        UNION

        SELECT oi.order_id, tb.event_id
        FROM order_items oi
        JOIN ticket_bundles tb
            ON tb.id = oi.bundle_id

    ) x
        ON x.order_id = o.id

    LEFT JOIN payments p
        ON p.order_id = o.id

    WHERE
        ${baseWhere}
        ${eventFilter}

    `;


        const [{ total }] =
            await sequelize.query(countSql, {
                replacements,
                type: QueryTypes.SELECT
            });

        return {

            rows: rows.map(r => ({

                id: r.id,

                invoice_no:
                    r.code_order,

                customer_name:
                    r.customer_name,

                customer_email:
                    maskEmail(r.customer_email),

                customer_phone:
                    maskPhone(r.customer_phone),

                event_name:
                    r.event_names || "-",

                total_ticket_qty:
                    Number(r.total_ticket_qty),

                total_amount:
                    Number(r.buyer_pay_total),

                status:
                    r.status.toUpperCase(),

                created_at:
                    toWIB(r.created_at),

                payment: {

                    method:
                        r.payment_method,

                    status:
                        (r.payment_status || r.status)
                            .toUpperCase(),

                    amount:
                        Number(r.amount),

                    paid_at:
                        r.paid_at
                            ? toWIB(r.paid_at)
                            : null

                }

            })),

            count: total,

            page: safePage,

            perPage: limit,

            totalPages:
                Math.ceil(total / limit),

        };

    },

    async getDetailOrder(order_id, customer_id) {

        const order = await Order.findOne({

            where: {
                id: order_id,
                customer_id
            },

            include: [

                {
                    model: OrderItem,
                    as: "items",

                    include: [

                        {
                            model: TicketType,
                            as: "ticket_type",

                            include: [
                                {
                                    model: Event,
                                    as: "event"
                                }
                            ]
                        },

                        {
                            model: TicketBundles,
                            as: "ticket_bundles",

                            include: [

                                {
                                    model: Event,
                                    as: "event"
                                },

                                {
                                    model: TicketBundleItem,
                                    as: "items",

                                    include: [
                                        {
                                            model: TicketType,
                                            as: "ticket_type"
                                        }
                                    ]
                                }

                            ]
                        },

                        {
                            model: Ticket,
                            as: "tickets",

                            attributes: [
                                "ticket_code",
                                "owner_name",
                                "owner_email",
                                "status",
                                "issued_at",
                                "sent_at"
                            ]
                        }

                    ]

                },

                {
                    model: Payment,
                    as: "payments",

                    attributes: [
                        "payment_method",
                        "status",
                        "amount",
                        "paid_at"
                    ]

                }

            ]

        });


        if (!order)
            throw new Error("Order not found");


        const pay =
            order.payments?.[0] ?? null;


        const totalTicketQty =
            order.items.reduce(
                (sum, i) =>
                    sum + Number(i.quantity),
                0
            );


        const totalTicketTypes =
            order.items.length;


        const financeSummary = {

            ticket_subtotal:
                Number(order.ticket_subtotal),

            admin_fee_total:
                Number(order.admin_fee_amount),

            tax_total:
                Number(order.tax_amount),

            grand_total:
                Number(order.buyer_pay_total)

        };


        const allTickets =
            order.items.flatMap(
                i => i.tickets
            );


        const firstIssued =
            allTickets
                .filter(t => t.issued_at)
                .sort(
                    (a, b) =>
                        new Date(a.issued_at)
                        - new Date(b.issued_at)
                )[0];


        const firstSent =
            allTickets
                .filter(t => t.sent_at)
                .sort(
                    (a, b) =>
                        new Date(a.sent_at)
                        - new Date(b.sent_at)
                )[0];


        const paymentStatus =
            normalizePaymentStatus(
                order,
                pay
            );


        const timeline = [

            {
                key: "created",
                label: "Order Created",

                date:
                    toWIB(order.created_at),

                active: true
            },

            ...(order.status === "waiting_payment"
                ? [
                    {
                        key: "waiting_payment",

                        label:
                            "Waiting Payment",

                        date:
                            toWIB(order.created_at),

                        active: true
                    }
                ]
                : []),

            {
                key: "paid",

                label: "Paid",

                date:
                    pay?.status === "paid"
                        ? toWIB(pay.paid_at)
                        : null,

                active:
                    paymentStatus === "PAID"
            },

            {
                key: "issued",

                label:
                    "Tickets Issued",

                date:
                    firstIssued
                        ? toWIB(firstIssued.issued_at)
                        : null,

                active:
                    !!firstIssued
            },

            {
                key: "sent",

                label:
                    "Tickets Sent",

                date:
                    firstSent
                        ? toWIB(firstSent.sent_at)
                        : null,

                active:
                    !!firstSent
            }

        ];


        const eventNames =

            order.items

                ?.map(i =>

                    i.ticket_type?.event?.name
                    || i.ticket_bundles?.event?.name

                )

                .filter(Boolean);


        return {

            id: order.id,

            invoice_no:
                order.code_order,


            customer_name:
                order.customer_name,

            customer_email:
                maskEmail(order.customer_email),

            customer_phone:
                maskPhone(order.customer_phone),


            event_name:
                eventNames?.length
                    ? [...new Set(eventNames)].join(", ")
                    : "-",


            total_amount:
                Number(order.buyer_pay_total),


            status:
                order.status.toUpperCase(),

            created_at:
                toWIB(order.created_at),


            total_ticket_qty:
                totalTicketQty,

            total_ticket_types:
                totalTicketTypes,


            finance_summary:
                financeSummary,


            payment:

                pay

                    ? {

                        method:
                            pay.payment_method,

                        status:

                            paymentStatus
                                ? paymentStatus.toUpperCase()
                                : "UNPAID",

                        amount:
                            Number(pay.amount),

                        paid_at:

                            pay.paid_at
                                && pay.status === "paid"

                                ? toWIB(pay.paid_at)

                                : null

                    }

                    : {

                        method: null,

                        status:
                            order.status.toUpperCase(),

                        amount:
                            Number(order.buyer_pay_total),

                        paid_at: null

                    },


            timeline,


            items:

                order.items.map(i => {

                    const isBundle =
                        i.item_type === "bundle";


                    return {

                        id:
                            i.id,


                        item_type:
                            i.item_type,


                        name:

                            isBundle

                                ? i.ticket_bundles?.name

                                : i.ticket_type?.name,


                        event_name:

                            isBundle

                                ? i.ticket_bundles?.event?.name

                                : i.ticket_type?.event?.name,


                        quantity:
                            i.quantity,


                        ticket_price:
                            Number(i.ticket_price),


                        admin_fee:
                            Number(i.admin_fee_amount),


                        tax:
                            Number(i.tax_amount),


                        total_price:
                            Number(i.buyer_pay_amount),


                        bundle_items:

                            isBundle

                                ? i.ticket_bundles?.items?.map(b => ({

                                    ticket_type_name:
                                        b.ticket_type?.name,

                                    qty:
                                        b.quantity

                                }))

                                : [],


                        tickets:

                            i.tickets?.map(t => ({

                                ticket_code:
                                    t.ticket_code,

                                owner_name:
                                    t.owner_name,

                                owner_email:
                                    maskEmail(t.owner_email),

                                status:
                                    t.status,

                                issued_at:

                                    t.issued_at
                                        ? toWIB(t.issued_at)
                                        : null,

                                sent_at:

                                    t.sent_at
                                        ? toWIB(t.sent_at)
                                        : null

                            })) ?? []

                    };

                })

        };

    },
}