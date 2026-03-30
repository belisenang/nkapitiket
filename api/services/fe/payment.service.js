const {
  sequelize,
  Order,
  OrderItem,
  TicketType,
  TicketBundles,
  Event,
  Payment
} = require("../../../models");

const xendit = require("../../utils/xendit");
const { v4: uuid } = require("uuid");

module.exports = {

  async createInvoice(orderId) {

    const trx = await sequelize.transaction();

    try {

      /* ===============================
         ORDER
      =============================== */

      const order = await Order.findByPk(

        orderId,

        {
          transaction: trx,
          lock: trx.LOCK.UPDATE
        }

      );

      if (!order)
        throw new Error("Order not found");

      if (order.status !== "waiting_payment")
        throw new Error("Order cannot be paid");


      /* ===============================
         PREVENT DUPLICATE INVOICE
      =============================== */

      const existing = await Payment.findOne({

        where: {
          order_id: orderId,
          status: "pending"
        },

        transaction: trx

      });

      if (existing) {

        await trx.commit();

        return existing;

      }


      /* ===============================
         LOAD ORDER ITEMS
      =============================== */

      const items = await OrderItem.findAll({

        where: { order_id: orderId },

        include: [

          {
            model: TicketType,
            as: "ticket_type",
            attributes: [
              "id",
              "name",
              "event_id"
            ]
          },

          {
            model: TicketBundles,
            as: "ticket_bundles",
            attributes: [
              "id",
              "name",
              "event_id"
            ]
          }

        ],

        transaction: trx

      });

      if (!items.length)
        throw new Error("Order items not found");


      /* ===============================
         LOAD EVENT
      =============================== */

      let eventId = null;

      for (const item of items) {

        if (item.ticket_type) {

          eventId =
            item.ticket_type.event_id;

          break;

        }

      }

      if (!eventId) {

        const bundleItem =
          items.find(
            i => i.ticket_bundles
          );

        eventId =
          bundleItem?.ticket_bundles?.event_id;

      }

      const event =
        await Event.findByPk(eventId);

      const mediaBase =
        process.env.MEDIA_URL_FRONTEND || "";

      const EVENT_INFO = {

        name: event?.name || "",

        logo: event?.image
          ? mediaBase + event.image
          : null,

        location:
          event?.location || "",

        province:
          event?.province || "",

        district:
          event?.district || "",

        date:
          event?.date_start || "",

        time:
          event?.time_start || "",

        timezone:
          event?.timezone || ""

      };


      /* ===============================
         BUILD XENDIT ITEMS
      =============================== */

      /* BUILD XENDIT ITEMS */

      const capitalize = (str) =>
        str?.toLowerCase()
          .replace(/\b\w/g, l => l.toUpperCase());

      let xenditItems = [];

      /* ticket & bundle lines */

      for (const item of items) {

        if (item.item_type === "ticket") {

          xenditItems.push({

            name:
              capitalize(
                item.ticket_type.name
              ),

            quantity:
              Number(item.quantity),

            price:
              Number(item.ticket_price),

            category: "ticket"

          });

        }

        if (item.item_type === "bundle") {

          xenditItems.push({

            name:
              capitalize(
                item.ticket_bundles.name
              ),

            quantity:
              Number(item.quantity),

            price:
              Number(item.ticket_price),

            category: "bundle"

          });

        }

      }

      /* ======================
      ONLY BUYER FEE
      ====================== */

      let totalAdminFeeBuyer =
        (order.admin_fee_bearer === "buyer"
          || order.admin_fee_bearer === "mixed")

          ? Number(order.admin_fee_amount)
          : 0;

      let totalTaxBuyer =
        (order.tax_bearer === "buyer"
          || order.tax_bearer === "mixed")

          ? Number(order.tax_amount)
          : 0;


      /* ===============================
         ADD SERVICE FEE
      =============================== */

      if (totalAdminFeeBuyer > 0) {

        xenditItems.push({

          name: "Biaya Layanan",

          quantity: 1,

          price: totalAdminFeeBuyer,

          category: "service_fee"

        });

      }


      /* ===============================
         ADD TAX
      =============================== */

      if (totalTaxBuyer > 0) {

        xenditItems.push({

          name: "Pajak",

          quantity: 1,

          price: totalTaxBuyer,

          category: "tax"

        });

      }


      /* ===============================
         DESCRIPTION
      =============================== */

      const description = `
Pembayaran tiket event ${EVENT_INFO.name}. Harga sudah termasuk biaya layanan & pajak.
      `.trim();


      /* ===============================
         CREATE INVOICE
      =============================== */

      const expiryTime =
        new Date(
          Date.now() + 60 * 60 * 1000
        ).toISOString();


      const invoice =
        await xendit.Invoice.createInvoice({

          data: {

            externalId:
              order.code_order,

            amount:
              Number(
                order.buyer_pay_total
              ),

            currency: "IDR",

            description,

            items:
              xenditItems,

            customer: {

              givenNames:
                order.customer_name,

              email:
                order.customer_email,

              mobileNumber:
                order.customer_phone

            },

            successRedirectUrl:
              process.env
                .FRONTEND_SUCCESS_URL,

            failureRedirectUrl:
              process.env
                .FRONTEND_FAILED_URL,

            expiryDate:
              expiryTime

          }

        });


      /* ===============================
         SAVE PAYMENT
      =============================== */

      const payment =
        await Payment.create({

          id: uuid(),

          order_id:
            orderId,

          provider: "xendit",

          provider_transactions:
            invoice.id,

          amount:
            order.buyer_pay_total,

          status: "pending",

          payment_method:
            order.payment_method,

          invoice_url:
            invoice.invoiceUrl,

          raw_callback_log:
            JSON.stringify(invoice)

        },

          { transaction: trx }

        );


      await trx.commit();

      return payment;

    }

    catch (err) {

      await trx.rollback();

      throw err;

    }

  }

};