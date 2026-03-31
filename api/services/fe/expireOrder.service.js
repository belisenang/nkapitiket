const {
    sequelize,
    Order,
    OrderItem,
    TicketType,
    Payment
} = require("../../../models");

const { Op } = require("sequelize");

module.exports = {

    async releaseExpiredOrders() {

        console.log("⏱ Cron: Checking expired orders...");

        const now = new Date();

        const orders = await Order.findAll({

            where: {

                status: "waiting_payment",

                expired_at: {
                    [Op.lte]: now
                }

            },

            limit: 50,

            attributes: ["id"]

        });

        if (!orders.length) {

            console.log("No expired orders");

            return;

        }

        console.log(`Found ${orders.length} expired orders`);

        for (const order of orders) {

            const trx = await sequelize.transaction();

            try {

                const items = await OrderItem.findAll({

                    where: {

                        order_id: order.id,

                        // hanya item ticket
                        ticket_type_id: {
                            [Op.ne]: null
                        }

                    },

                    attributes: [
                        "ticket_type_id",
                        "quantity"
                    ],

                    transaction: trx

                });


                /*
                ========================
                GROUP QTY PER TICKET
                ========================
                */

                const ticketMap = {};

                for (const item of items) {

                    if (!item.ticket_type_id) continue;

                    ticketMap[item.ticket_type_id] =
                        (ticketMap[item.ticket_type_id] || 0)
                        + item.quantity;

                }


                /*
                ========================
                RELEASE RESERVED STOCK
                ========================
                */

                for (const ticketTypeId in ticketMap) {

                    const qty = ticketMap[ticketTypeId];

                    await TicketType.decrement(

                        { reserved_stock: qty },

                        {

                            where: {
                                id: ticketTypeId
                            },

                            transaction: trx

                        }

                    );

                }


                /*
                ========================
                UPDATE ORDER STATUS
                ========================
                */

                await Order.update(

                    {

                        status: "expired"

                    },

                    {

                        where: {
                            id: order.id
                        },

                        transaction: trx

                    }

                );


                await Payment.update(

                    {

                        status: "expired"

                    },

                    {

                        where: {
                            order_id: order.id
                        },

                        transaction: trx

                    }

                );


                await trx.commit();

                console.log("Released stock:", order.id);

            }

            catch (err) {

                await trx.rollback();

                console.error(

                    "Release stock error:",
                    order.id,
                    err.message

                );

            }

        }

    }

};