// webhooks/payout.webhook.js

const {
  sequelize,
  Payouts,
  CreatorFinancials
} = require("../../models");

module.exports = {

  async payoutWebhook(req, res) {

    const trx =
      await sequelize.transaction();

    try {

      /*
      ========================
      EVENT FILTER
      ========================
      */

      const event =
        req.body;

      if (
        !event.event?.startsWith(
          "disbursement."
        )
      ) {

        await trx.rollback();

        return res.json({
          received: true
        });

      }


      /*
      ========================
      FIND PAYOUT
      ========================
      */

      const disbursementId =
        event.data.id;

      const payout =
        await Payouts.findOne({

          where: {

            xendit_disbursement_id:
              disbursementId

          },

          transaction: trx,

          lock:
            trx.LOCK.UPDATE

        });


      if (!payout) {

        await trx.rollback();

        return res.json({
          received: true
        });

      }


      /*
      ========================
      IDEMPOTENT PROTECTION
      ========================
      */

      if (
        payout.status ===
        "COMPLETED"
      ) {

        await trx.rollback();

        return res.json({
          received: true
        });

      }


      /*
      ========================
      SUCCESS
      ========================
      */

      if (
        event.event ===
        "disbursement.completed"
      ) {

        payout.status =
          "COMPLETED";

        payout.completed_at =
          new Date();

        await payout.save({

          transaction: trx

        });

      }


      /*
      ========================
      FAILED → REFUND SALDO
      ========================
      */

      if (
        event.event ===
        "disbursement.failed"
      ) {

        payout.status =
          "FAILED";

        payout.failure_reason =
          event.data.failure_code;


        const fin =
          await CreatorFinancials
            .findOne({

              where: {

                creator_id:
                  payout.creator_id

              },

              transaction: trx,

              lock:
                trx.LOCK.UPDATE

            });


        /*
        refund saldo creator
        */

        fin.current_balance =
          Number(fin.current_balance)
          + Number(payout.amount);


        fin.total_payout =
          Math.max(

            0,

            Number(fin.total_payout)
            - Number(payout.amount)

          );


        await fin.save({

          transaction: trx

        });


        await payout.save({

          transaction: trx

        });

      }


      await trx.commit();


      console.log(
        "xendit payout webhook:",
        event.event,
        payout.id
      );


      return res.json({

        received: true

      });

    }

    catch (err) {

      await trx.rollback();

      console.error(
        "payout webhook error:",
        err.message
      );

      return res.json({

        received: true

      });

    }

  }

};