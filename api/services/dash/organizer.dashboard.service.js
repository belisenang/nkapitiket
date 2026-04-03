const {
    Event,
    Order,
    OrderItem,
    sequelize
} = require("../../../models");

const {
    Op,
    fn,
    col,
    literal,
    QueryTypes
} = require("sequelize");

const { maskEmail } = require("../../../utils/maskEmail");
const { maskPhone } = require("../../../utils/maskPhone");
const { toWIB } = require("../../utils/wib");
module.exports = {

    async getDashboard(creatorId) {

        const [
            stats,
            revenue_chart,
            recent_orders,
            latest_events,
            ticket_breakdown
        ] = await Promise.all([

            getStats(creatorId),

            getRevenueChart(creatorId),

            getRecentOrders(creatorId),

            getLatestEvents(creatorId),

            getTicketBreakdown(creatorId)

        ]);

        return {

            stats,
            revenue_chart,
            recent_orders,
            latest_events,
            ticket_breakdown

        };

    }

};

/* ========================= */

async function getStats(creatorId) {

    const totalEvents =
        await Event.count({

            where: {
                creator_id: creatorId
            }

        });

    /*
    SEMUA ORDER
    */

    const totalOrders =
        await Order.count({

            where: {
                creator_id: creatorId
            }

        });

    /*
    PENDING
    */

    const pendingOrders =
        await Order.count({

            where: {
                creator_id: creatorId,
                status: "waiting_payment"
            }

        });

    /*
    PAID ORDER
    */

    const paidOrders =
        await Order.count({

            where: {
                creator_id: creatorId,
                status: "paid"
            }

        });

    /*
    TICKET RESERVED + PAID
    */

    const ticketsSold =
        await OrderItem.sum("quantity", {

            include: [
                {
                    model: Order,
                    as: "order",
                    where: {
                        creator_id: creatorId,
                        status: {
                            [Op.in]: [
                                "waiting_payment",
                                "paid"
                            ]
                        }
                    }
                }
            ]

        }) || 0;

    /*
    REVENUE hanya paid
    */

    const totalRevenue =
        await Order.sum(

            "organizer_net_total",

            {
                where: {
                    creator_id: creatorId,
                    status: "paid"
                }
            }

        ) || 0;

    /*
    conversion rate
    */

    const conversionRate =
        totalOrders
            ? (
                paidOrders /
                totalOrders
                * 100
            ).toFixed(1)
            : 0;

    return {

        totalEvents,
        totalOrders,
        pendingOrders,
        paidOrders,
        ticketsSold,
        totalRevenue,
        conversionRate

    };

}

/* ========================= */

async function getRevenueChart(creatorId) {

    return Order.findAll({

        attributes: [
            [
                fn("DATE", col("created_at")),
                "date"
            ],
            [
                fn(
                    "SUM",
                    col("organizer_net_total")
                ),
                "revenue"
            ]
        ],

        where: {
            creator_id: creatorId,
            status: "paid",
            created_at: {
                [Op.gte]:
                    literal(
                        "DATE_SUB(NOW(), INTERVAL 30 DAY)"
                    )
            }
        },

        group: [
            literal("DATE(created_at)")
        ],

        order: [
            [
                literal("DATE(created_at)"),
                "ASC"
            ]
        ]

    });

}

/* ========================= */

async function getRecentOrders(creatorId) {

    const sql = `

SELECT
o.id,

o.code_order as invoice_no,

o.customer_name,

o.customer_email,

o.status,

o.created_at,

o.buyer_pay_total as total_amount,

o.organizer_net_total as organizer_net,

p.payment_method,

p.status as payment_status,

GROUP_CONCAT(DISTINCT e.name)
as event_name,

SUM(oi.quantity)
as total_ticket_qty

FROM orders o

LEFT JOIN order_items oi
ON oi.order_id = o.id

LEFT JOIN ticket_types tt
ON tt.id = oi.ticket_type_id

LEFT JOIN ticket_bundles tb
ON tb.id = oi.bundle_id

LEFT JOIN events e
ON e.id =
COALESCE(
tt.event_id,
tb.event_id
)

LEFT JOIN payments p
ON p.order_id = o.id

WHERE
o.creator_id = :creatorId

GROUP BY o.id

ORDER BY o.created_at DESC

LIMIT 8

`;

    const rows =
        await sequelize.query(sql, {

            replacements: {
                creatorId
            },

            type: QueryTypes.SELECT

        });

    return rows.map(r => ({

        id: r.id,

        invoice_no: r.invoice_no,

        customer_name: r.customer_name,

        customer_email: maskEmail(
            r.customer_email
        ),

        event_name: r.event_name,

        total_ticket_qty:
            Number(r.total_ticket_qty || 0),

        total_amount:
            Number(r.total_amount),

        organizer_net:
            Number(r.organizer_net),

        status:
            r.status.toUpperCase(),

        payment: {
            method: r.payment_method,
            status:
                (r.payment_status || r.status)
                    .toUpperCase()
        },

        created_at:
            toWIB(r.created_at)

    }));

}

/* ========================= */

async function getLatestEvents(creatorId) {

    const sql = `

SELECT

e.id,
e.name,
e.image,
e.status,

e.date_start,

COALESCE(
SUM(oi.quantity)
,0
) as tickets_sold,

COALESCE(
SUM(o.organizer_net_total)
,0
) as revenue

FROM events e

LEFT JOIN ticket_types tt
ON tt.event_id = e.id

LEFT JOIN order_items oi
ON oi.ticket_type_id = tt.id

LEFT JOIN orders o
ON o.id = oi.order_id
AND o.status = 'paid'

WHERE
e.creator_id = :creatorId

GROUP BY e.id

ORDER BY e.created_at DESC

LIMIT 5

`;

    const rows =
        await sequelize.query(sql, {

            replacements: {
                creatorId
            },

            type: QueryTypes.SELECT

        });

    return rows.map(r => ({

        id: r.id,

        name: r.name,

        image: r.image,

        status: r.status,

        date_start: r.date_start,

        tickets_sold:
            Number(r.tickets_sold),

        revenue:
            Number(r.revenue)

    }));

}

/* ========================= */

async function getTicketBreakdown(creatorId) {

    const ticket =
        await OrderItem.sum("quantity", {

            where: {
                item_type: "ticket"
            },

            include: [
                {
                    model: Order,
                    as: "order",
                    where: {
                        creator_id: creatorId,
                        status: {
                            [Op.in]: [
                                "waiting_payment",
                                "paid"
                            ]
                        }
                    }
                }
            ]

        }) || 0;

    const bundle =
        await OrderItem.sum("quantity", {

            where: {
                item_type: "bundle"
            },

            include: [
                {
                    model: Order,
                    as: "order",
                    where: {
                        creator_id: creatorId,
                        status: {
                            [Op.in]: [
                                "waiting_payment",
                                "paid"
                            ]
                        }
                    }
                }
            ]

        }) || 0;

    return {

        ticket,
        bundle

    };

}