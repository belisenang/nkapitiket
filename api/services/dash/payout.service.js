// services/dash/payout.service.js
const {
    sequelize,
    Payouts,
    CreatorFinancials,
    Order,
    Payment,
    User
} = require("../../../models");
const { Op } = require("sequelize");
const { toWIB } = require("../../utils/wib");

function normalizeAmount(raw) {
    if (!raw) return 0;
    return Number(String(raw).replace(/[^0-9]/g, ""));
}

module.exports = {

    async getDashboard(creator_id, range = 30) {

        let fin = await CreatorFinancials.findOne({
            where: { creator_id }
        });

        if (!fin) {

            const totalPaid =
                await Order.sum(
                    "organizer_net_total",
                    {
                        where: {
                            creator_id,
                            status: "paid"
                        }
                    }
                );

            fin = await CreatorFinancials.create({

                creator_id,

                total_income: totalPaid || 0,

                total_payout: 0,

                current_balance: totalPaid || 0,

                pending_income: 0

            });

        }

        const pendingPayout =
            await Payouts.sum(
                "amount",
                {
                    where: {
                        creator_id,
                        status: {
                            [Op.in]:
                                ["REQUESTED", "APPROVED"]
                        }
                    }
                }
            ) || 0;


        const today = new Date();

        const startDate =
            new Date();

        startDate.setDate(
            today.getDate() - range
        );


        const paidOrders =
            await Order.findAll({

                where: {
                    creator_id,
                    status: "paid",
                    created_at: {
                        [Op.between]:
                            [startDate, today]
                    }
                },

                include: [{
                    model: Payment,
                    as: "payments",
                    required: true,
                    where: {
                        status: "paid"
                    }
                }],

                order: [
                    ["created_at", "ASC"]
                ]

            });


        const chartMap = {};

        for (const order of paidOrders) {

            const day =
                toWIB(order.created_at)
                    .slice(0, 10);

            if (!chartMap[day])
                chartMap[day] = 0;

            chartMap[day] +=
                Number(
                    order.organizer_net_total
                );

        }


        const chart =
            Object.keys(chartMap)
                .map(d => ({

                    date: d,

                    amount: chartMap[d]

                }));

        const yesterday =
            chart.at(-2)?.amount || 0;

        const todayIncome =
            chart.at(-1)?.amount || 0;


        const changePercent =
            yesterday === 0
                ? 0
                : (
                    (todayIncome - yesterday)
                    / yesterday
                ) * 100;


        return {

            balance:
                Number(fin.current_balance),

            total_income:
                Number(fin.total_income),

            total_payout:
                Number(fin.total_payout),

            pending_payout:
                Number(pendingPayout),

            change_percent:
                Number(
                    changePercent.toFixed(2)
                ),

            chart

        };

    },

    async getPayoutHistory(creator_id) {
        return await Payouts.findAll({
            where: { creator_id },
            order: [["created_at", "DESC"]],
        });
    },

    async createPayout(
        creator_id,
        rawAmount,
        io
    ) {

        const amount =
            normalizeAmount(rawAmount)

        if (!amount || amount <= 0)
            throw new Error(
                "Invalid payout amount"
            )

        if (amount < 50000)
            throw new Error(
                "Minimum payout 50.000"
            )

        const trx =
            await CreatorFinancials
                .sequelize
                .transaction()

        try {

            const fin =
                await CreatorFinancials
                    .findOne({

                        where: {
                            creator_id
                        },

                        transaction: trx,

                        lock:
                            trx.LOCK.UPDATE

                    })


            if (!fin)
                throw new Error(
                    "Financial record not found"
                )

            const existingRequest =
                await Payouts.findOne({

                    where: {

                        creator_id,

                        status: {
                            [Op.in]: [
                                "REQUESTED",
                                "PROCESSING",
                                "APPROVED"
                            ]
                        }

                    },

                    transaction: trx,

                    lock: trx.LOCK.UPDATE

                })


            if (existingRequest)
                throw new Error(
                    "Masih ada payout diproses"
                )


            const balance =
                Number(fin.current_balance)


            if (balance < amount)
                throw new Error(
                    "Insufficient balance"
                )


            fin.current_balance =
                balance - amount


            fin.total_payout =
                Number(fin.total_payout)
                + amount


            await fin.save({

                transaction: trx

            })

            const payout =
                await Payouts.create({

                    creator_id,

                    amount,

                    status: "REQUESTED"

                },

                    {

                        transaction: trx

                    })


            await trx.commit()

            io.to(
                `creator-${creator_id}`
            ).emit(
                "finance:update",
                {

                    type: "payout",

                    amount

                }
            )


            return payout

        }

        catch (err) {

            await trx.rollback()

            throw err

        }

    },

    async decreaseIncome(order_id, trx = null) {
        const order = await Order.findOne({
            where: { id: order_id },
            transaction: trx
        });

        if (!order) return;

        const fin = await CreatorFinancials.findOne({
            where: { creator_id: order.creator_id },
            transaction: trx,
            lock: trx?.LOCK?.UPDATE
        });

        if (!fin) return;

        const loss = Number(order.organizer_net_total);

        fin.total_income = Math.max(0, Number(fin.total_income) - loss);
        fin.current_balance = Math.max(0, Number(fin.current_balance) - loss);

        await fin.save({ transaction: trx });
    }
};
