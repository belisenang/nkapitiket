// controllers/fe/paymentCallback.controller.js

const {
  sequelize,
  Order,
  Event,
  Payment,
  OrderItem,
  TicketType,
  TicketBundles,
  TicketBundleItem,
  CreatorFinancials
} = require("../../../models");

const ticketService =
  require("../../services/fe/ticket.service");

const payoutService =
  require("../../services/dash/payout.service");


const SUCCESS_STATUS = [
  "PAID",
  "SETTLED",
  "SUCCEEDED",
  "COMPLETED"
];

const EXPIRED_STATUS = [
  "EXPIRED"
];

const REFUND_STATUS = [
  "REFUND",
  "REFUNDED"
];


module.exports = {

  async xenditCallback(req, res) {

    try {

      const {

        id,
        status,
        payment_status

      } = req.body;


      const normalizedStatus =
        String(
          status ||
          payment_status ||
          ""
        )
          .toUpperCase()
          .trim();


      console.log(
        "callback status:",
        normalizedStatus
      );


      const payment =
        await Payment.findOne({

          where: {

            provider_transactions:
              id

          }

        });


      if (!payment) {

        return res.json({
          success: true
        });

      }


      const trx =
        await sequelize.transaction();


      try {

        /* ========================
           LOCK PAYMENT
        ======================== */

        const lockedPayment =
          await Payment.findByPk(

            payment.id,

            {

              transaction: trx,

              lock:
                trx.LOCK.UPDATE

            }

          );


        /* prevent duplicate callback */

        if (
          lockedPayment.status === "paid"
        ) {

          await trx.commit();

          return res.json({
            success: true
          });

        }


        /* ========================
           LOCK ORDER
        ======================== */

        const order =
          await Order.findByPk(

            lockedPayment.order_id,

            {

              transaction: trx,

              lock:
                trx.LOCK.UPDATE

            }

          );


        const items =
          await OrderItem.findAll({

            where: {

              order_id:
                order.id

            },

            transaction: trx,

            lock:
              trx.LOCK.UPDATE

          });


        /* ========================
           PAYMENT SUCCESS
        ======================== */

        if (
          SUCCESS_STATUS.includes(
            normalizedStatus
          )
        ) {

          console.log(
            "PAYMENT SUCCESS"
          );


          let eventSoldMap = {};


          for (const item of items) {

            /* =====================
               SINGLE TICKET
            ===================== */

            if (
              item.item_type === "ticket"
            ) {

              const tt =
                await TicketType.findByPk(

                  item.ticket_type_id,

                  {

                    transaction: trx,

                    lock:
                      trx.LOCK.UPDATE

                  }

                );


              tt.reserved_stock -=
                item.quantity;

              tt.ticket_sold +=
                item.quantity;


              await tt.save({
                transaction: trx
              });


              eventSoldMap[
                tt.event_id
              ] =
                (
                  eventSoldMap[
                  tt.event_id
                  ] || 0
                )
                + item.quantity;

            }


            /* =====================
               BUNDLE
            ===================== */

            if (
              item.item_type === "bundle"
            ) {

              const bundle =
                await TicketBundles.findByPk(

                  item.bundle_id,

                  {

                    include: [

                      {

                        model:
                          TicketBundleItem,

                        as:
                          "items"

                      }

                    ],

                    transaction:
                      trx,

                    lock:
                      trx.LOCK.UPDATE

                  }

                );


              bundle.reserved_stock -=
                item.quantity;

              bundle.sold +=
                item.quantity;


              await bundle.save({

                transaction: trx

              });


              for (const bItem of bundle.items) {

                const tt =
                  await TicketType.findByPk(

                    bItem.ticket_type_id,

                    {

                      transaction:
                        trx,

                      lock:
                        trx.LOCK.UPDATE

                    }

                  );


                const soldQty =
                  bItem.quantity
                  * item.quantity;


                tt.reserved_stock -=
                  soldQty;

                tt.ticket_sold +=
                  soldQty;


                await tt.save({
                  transaction: trx
                });


                eventSoldMap[
                  tt.event_id
                ] =
                  (
                    eventSoldMap[
                    tt.event_id
                    ] || 0
                  )
                  + soldQty;

              }

            }

          }


          /* ========================
             UPDATE EVENT SOLD
          ======================== */

          for (const [

            eventId,
            qty

          ] of Object.entries(
            eventSoldMap
          )) {

            await Event.increment(

              {

                total_ticket_sold:
                  qty

              },

              {

                where: {

                  id:
                    eventId

                },

                transaction: trx

              }

            );

          }


          /* ========================
             UPDATE ORDER & PAYMENT
          ======================== */

          await order.update(

            {

              status: "paid"

            },

            {

              transaction: trx

            }

          );


          await lockedPayment.update(

            {

              status: "paid",

              paid_at:
                new Date(),

              raw_callback_log:
                JSON.stringify(
                  req.body
                )

            },

            {

              transaction: trx

            }

          );


          /* ========================
             CREATOR FINANCIAL
          ======================== */

          const income =
            Number(
              order.organizer_net_total || 0
            );


          let fin =
            await CreatorFinancials.findOne({

              where: {

                creator_id:
                  order.creator_id

              },

              transaction: trx,

              lock:
                trx.LOCK.UPDATE

            });


          if (!fin) {

            await CreatorFinancials.create({

              creator_id:
                order.creator_id,

              total_income:
                income,

              current_balance:
                income,

              total_payout: 0,

              pending_income: 0

            },

              {

                transaction: trx

              });

          }

          else {

            await CreatorFinancials.increment(

              {

                total_income:
                  income,

                current_balance:
                  income

              },

              {

                where: {

                  creator_id:
                    order.creator_id

                },

                transaction: trx

              }

            );

          }


          /* realtime update */

          const io =
            req.app.get("io");

          io.to(
            `creator-${order.creator_id}`
          ).emit(
            "finance:update",
            {

              type: "income",

              amount: income

            }
          );


          /* generate ticket */

          await ticketService.generateTickets(

            order.id,

            trx

          );

        }


        /* ========================
           EXPIRED
        ======================== */

        if (
          EXPIRED_STATUS.includes(
            normalizedStatus
          )
        ) {

          if (
            order.status === "paid"
          ) {

            await payoutService
              .decreaseIncome(

                order.id,

                trx

              );

          }


          await order.update(

            {

              status: "expired"

            },

            {

              transaction: trx

            }

          );


          await lockedPayment.update(

            {

              status: "expired"

            },

            {

              transaction: trx

            }

          );

        }


        /* ========================
           REFUND
        ======================== */

        if (
          REFUND_STATUS.includes(
            normalizedStatus
          )
        ) {

          if (
            order.status === "paid"
          ) {

            await payoutService
              .decreaseIncome(

                order.id,

                trx

              );

          }


          await order.update(

            {

              status: "refund"

            },

            {

              transaction: trx

            }

          );


          await lockedPayment.update(

            {

              status: "refund"

            },

            {

              transaction: trx

            }

          );

        }


        await trx.commit();


        return res.json({
          success: true
        });

      }

      catch (err) {

        await trx.rollback();

        console.error(
          "callback trx error",
          err
        );


        return res.json({
          success: true
        });

      }

    }

    catch (err) {

      console.error(
        "callback error",
        err
      );


      return res.json({
        success: true
      });

    }

  }

};