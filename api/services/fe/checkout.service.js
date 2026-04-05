const {
  sequelize,
  Order,
  OrderItem,
  TicketType,
  CustomerUser,
  CreatorFinanceSettings,
  SystemFinanceSettings,
  TicketBundles,
  TicketBundleItem,
  Event
} = require("../../../models");

const { v4: uuid } = require("uuid");

module.exports = {

  async checkout(payload) {

    const trx = await sequelize.transaction();

    try {

      const { customer, items } = payload;

      if (!items?.length)
        throw new Error("Items required");

      /* =========================
      CUSTOMER
      ========================= */

      let customerUser =
        await CustomerUser.findOne({
          where: { email: customer.email },
          transaction: trx
        });

      if (!customerUser) {

        customerUser =
          await CustomerUser.create({

            full_name: customer.full_name,
            email: customer.email,
            phone: customer.phone

          }, { transaction: trx });

      }

      /* =========================
      SYSTEM FINANCE
      ========================= */

      const systemFinance =
        await SystemFinanceSettings.findOne({
          transaction: trx
        });

      const TAX_RATE =
        Number(systemFinance.tax_rate) / 100;

      /* =========================
      PRELOAD TICKETS
      ========================= */

      const ticketIds =
        items
          .filter(i => i.type === "ticket")
          .map(i => i.ticket_type_id);

      const tickets =
        await TicketType.findAll({

          where: { id: ticketIds },

          include: [{
            model: Event,
            as: "event",
            attributes: ["id", "creator_id"]
          }],

          transaction: trx,
          lock: trx.LOCK.UPDATE

        });

      const ticketMap = {};
      tickets.forEach(t => ticketMap[t.id] = t);

      /* =========================
      PRELOAD BUNDLES
      ========================= */

      const bundleIds =
        items
          .filter(i => i.type === "bundle")
          .map(i => i.bundle_id);

      const bundles =
        await TicketBundles.findAll({

          where: { id: bundleIds },

          include: [
            {
              model: TicketBundleItem,
              as: "items"
            }
          ],

          transaction: trx,
          lock: trx.LOCK.UPDATE

        });

      const bundleMap = {};
      bundles.forEach(b => bundleMap[b.id] = b);

      /* =========================
      GLOBAL STATE
      ========================= */

      let eventIdGlobal = null;
      let creatorId = null;

      let ticketSubtotal = 0;
      let totalAdminFee = 0;
      let totalTax = 0;

      let buyerPayTotal = 0;
      let organizerNetTotal = 0;

      let adminFeeBearer = null;
      let taxBearer = null;

      const computedItems = [];

      /* =========================
      VALIDATE ALL ITEMS
      ========================= */

      for (const item of items) {

        if (!item.type)
          throw new Error("Item type required");

        if (!item.quantity || item.quantity <= 0)
          throw new Error("Invalid quantity");

        /* ================= TICKET ================= */

        if (item.type === "ticket") {

          const t =
            ticketMap[item.ticket_type_id];

          if (!t)
            throw new Error("Ticket not found");

          validateSaleTime(t);
          validateMaxOrder(t, item.quantity);
          validateAttendeesExact(item);

          /* event validation */

          if (!eventIdGlobal)
            eventIdGlobal = t.event_id;

          if (eventIdGlobal !== t.event_id)
            throw new Error("Cannot checkout multiple events");

          /* creator */

          if (!creatorId)
            creatorId = t.event.creator_id;

          /* stock */

          const available =
            t.total_stock -
            t.ticket_sold -
            t.reserved_stock;

          if (available < item.quantity)
            throw new Error(`Stock not enough ${t.name}`);

          /* reserve */

          await TicketType.increment(

            { reserved_stock: item.quantity },

            { where: { id: t.id }, transaction: trx }

          );

          /* finance */

          const creatorFinance =
            await CreatorFinanceSettings.findOne({

              where: { creator_id: creatorId },
              transaction: trx

            });

          const price =
            Number(t.price);

          const qty =
            item.quantity;

          const subtotal =
            price * qty;

          /* admin fee */

          let adminFeeSingle = 0;

          if (creatorFinance.admin_fee_type === "flat")
            adminFeeSingle =
              Number(creatorFinance.admin_fee_value);

          else
            adminFeeSingle =
              price *
              (Number(
                creatorFinance.admin_fee_value
              ) / 100);

          const adminFeeTotal =
            adminFeeSingle * qty;

          /* tax */

          const taxTotal =
            price * TAX_RATE * qty;

          /* bearer */

          const buyerPaysAdmin =
            t.admin_fee_included == 1;

          const buyerPaysTax =
            t.tax_included == 1;

          adminFeeBearer =
            resolveBearer(
              adminFeeBearer,
              buyerPaysAdmin
            );

          taxBearer =
            resolveBearer(
              taxBearer,
              buyerPaysTax
            );

          /* totals */

          let buyerTotal = subtotal;
          let organizerNet = subtotal;

          if (buyerPaysAdmin)
            buyerTotal += adminFeeTotal;
          else
            organizerNet -= adminFeeTotal;

          if (buyerPaysTax)
            buyerTotal += taxTotal;
          else
            organizerNet -= taxTotal;

          ticketSubtotal += subtotal;

          totalAdminFee += adminFeeTotal;
          totalTax += taxTotal;

          buyerPayTotal += buyerTotal;
          organizerNetTotal += organizerNet;

          /* save */

          computedItems.push({

            type: "ticket",

            ref: t,

            qty,

            attendees: item.attendees,

            ticket_price: price,

            admin_fee_amount: adminFeeTotal,

            tax_amount: taxTotal,

            buyer_pay_amount: buyerTotal,

            organizer_net: organizerNet

          });

        }

        /* ================= BUNDLE ================= */

        if (item.type === "bundle") {

          const bundle =
            bundleMap[item.bundle_id];

          if (!bundle)
            throw new Error("Bundle not found");

          validateSaleTime(bundle);

          if (!bundle.items.length)
            throw new Error("Bundle empty");

          /* event validation */

          if (!eventIdGlobal)
            eventIdGlobal = bundle.event_id;

          if (eventIdGlobal !== bundle.event_id)
            throw new Error("Cannot checkout multiple events");

          /* bundle stock */

          const bundleStock =
            bundle.total_stock -
            bundle.sold -
            bundle.reserved_stock;

          if (bundleStock < item.quantity)
            throw new Error("Bundle stock not enough");

          /* load ticket dalam bundle */

          const bundleTicketIds =
            bundle.items.map(
              i => i.ticket_type_id
            );

          const bundleTickets =
            await TicketType.findAll({

              where: { id: bundleTicketIds },

              include: [{
                model: Event,
                as: "event",
                attributes: ["creator_id"]
              }],

              transaction: trx,
              lock: trx.LOCK.UPDATE

            });

          const bundleTicketMap = {};

          bundleTickets.forEach(t => {

            bundleTicketMap[t.id] = t;

            if (!creatorId)
              creatorId =
                t.event.creator_id;

          });

          /* validate attendee bundle */

          const totalTicketNeeded =
            bundle.items.reduce(

              (sum, i) =>
                sum + Number(i.quantity),

              0

            ) * item.quantity;

          if (
            !item.attendees
            || item.attendees.length !== totalTicketNeeded
          )

            throw new Error(

              `Bundle membutuhkan ${totalTicketNeeded} attendee`

            );

          /* reserve stock ticket */

          for (const bItem of bundle.items) {

            const t =
              bundleTicketMap[
              bItem.ticket_type_id
              ];

            const needed =
              bItem.quantity *
              item.quantity;

            const available =
              t.total_stock -
              t.ticket_sold -
              t.reserved_stock;

            if (available < needed)

              throw new Error(

                `Stock not enough ${t.name}`

              );

            await TicketType.increment(

              { reserved_stock: needed },

              {
                where: { id: t.id },
                transaction: trx
              }

            );

          }

          /* reserve bundle */

          await TicketBundles.increment(

            { reserved_stock: item.quantity },

            {
              where: { id: bundle.id },
              transaction: trx
            }

          );

          /* finance bundle */

          const creatorFinance =
            await CreatorFinanceSettings.findOne({

              where: { creator_id: creatorId },
              transaction: trx

            });

          let bundleAdminFee = 0;
          let bundleTax = 0;

          /* hitung fee berdasarkan ticket di bundle */

          for (const bItem of bundle.items) {

            const t =
              bundleTicketMap[
              bItem.ticket_type_id
              ];

            const unitPrice =
              Number(t.price);

            const unitQty =
              bItem.quantity *
              item.quantity;

            /* admin fee */

            let adminFeeSingle = 0;

            if (creatorFinance.admin_fee_type === "flat")

              adminFeeSingle =
                Number(
                  creatorFinance.admin_fee_value
                );

            else

              adminFeeSingle =
                unitPrice *
                (Number(
                  creatorFinance.admin_fee_value
                ) / 100);

            const adminFeeTotal =
              adminFeeSingle *
              unitQty;

            /* tax */

            const taxTotal =
              unitPrice *
              TAX_RATE *
              unitQty;

            /* bearer */

            const buyerPaysAdmin =
              t.admin_fee_included == 1;

            const buyerPaysTax =
              t.tax_included == 1;

            adminFeeBearer =
              resolveBearer(
                adminFeeBearer,
                buyerPaysAdmin
              );

            taxBearer =
              resolveBearer(
                taxBearer,
                buyerPaysTax
              );

            /* accumulate */

            if (buyerPaysAdmin)
              bundleAdminFee += adminFeeTotal;
            else
              organizerNetTotal -= adminFeeTotal;

            if (buyerPaysTax)
              bundleTax += taxTotal;
            else
              organizerNetTotal -= taxTotal;

            totalAdminFee += adminFeeTotal;
            totalTax += taxTotal;

          }

          /* bundle price */

          const bundleSubtotal =
            Number(bundle.price) *
            item.quantity;

          ticketSubtotal += bundleSubtotal;

          const buyerBundleTotal =
            bundleSubtotal +
            bundleAdminFee +
            bundleTax;

          buyerPayTotal += buyerBundleTotal;

          organizerNetTotal += bundleSubtotal;

          /* save */

          computedItems.push({

            type: "bundle",

            ref: bundle,

            qty: item.quantity,

            attendees: item.attendees,

            ticket_price: bundle.price,

            admin_fee_amount: bundleAdminFee,

            tax_amount: bundleTax,

            buyer_pay_amount: buyerBundleTotal,

            organizer_net: bundleSubtotal

          });

        }

      }

      /* =========================
      DEFAULT BEARER
      ========================= */

      if (!adminFeeBearer)
        adminFeeBearer = "buyer";

      if (!taxBearer)
        taxBearer = "buyer";

      /* =========================
      CREATE ORDER
      ========================= */

      const random4 =
        Math.random()
          .toString(36)
          .substring(2, 6)
          .toUpperCase();

      const timestamp =
        new Date()
          .toISOString()
          .replace(/[-:TZ.]/g, "")
          .slice(2, 12);

      const codeOrder =
        `${timestamp}-${random4}`;

      const order =
        await Order.create({

          id: uuid(),

          creator_id: creatorId,

          code_order: codeOrder,

          customer_id: customerUser.id,

          customer_name: customer.full_name,
          customer_email: customer.email,
          customer_phone: customer.phone,

          ticket_subtotal: ticketSubtotal,

          admin_fee_amount: totalAdminFee,
          tax_amount: totalTax,

          buyer_pay_total: buyerPayTotal,

          organizer_net_total: organizerNetTotal,

          admin_fee_bearer: adminFeeBearer,
          tax_bearer: taxBearer,

          payment_method: payload.payment_method,

          status: "waiting_payment",

          expired_at:
            new Date(
              Date.now() + 15 * 60 * 1000
            )

        }, { transaction: trx });

      /* =========================
      CREATE ORDER ITEMS
      ========================= */

      const orderItems =
        computedItems.map(data => ({

          id: uuid(),

          order_id: order.id,

          item_type: data.type,

          ticket_type_id:
            data.type === "ticket"
              ? data.ref.id
              : null,

          bundle_id:
            data.type === "bundle"
              ? data.ref.id
              : null,

          quantity: data.qty,

          ticket_price: data.ticket_price,

          admin_fee_amount:
            data.admin_fee_amount,

          tax_amount:
            data.tax_amount,

          buyer_pay_amount:
            data.buyer_pay_amount,

          organizer_net:
            data.organizer_net,

          attendees:
            data.attendees

        }));

      await OrderItem.bulkCreate(

        orderItems,

        { transaction: trx }

      );

      await trx.commit();

      return {

        order_id: order.id,

        code_order: order.code_order,

        buyer_pay_total: buyerPayTotal,

        expired_at: order.expired_at

      };

    }

    catch (err) {

      await trx.rollback();
      throw err;

    }

  },

  async calculateTax(payload) {

    const { items } = payload;

    if (!items?.length)
      throw new Error("Items required");

    /* =========================
       SYSTEM TAX
    ========================= */

    const systemFinance =
      await SystemFinanceSettings.findOne();

    const TAX_RATE =
      Number(systemFinance.tax_rate) / 100;

    /* =========================
       LOAD TICKETS
    ========================= */

    const ticketIds =
      items
        .filter(i => i.type === "ticket")
        .map(i => i.ticket_type_id);

    const tickets =
      await TicketType.findAll({

        where: { id: ticketIds },

        include: [
          {
            model: Event,
            as: "event",
            attributes: ["creator_id"]
          }
        ]

      });

    const ticketMap = {};

    tickets.forEach(
      t => ticketMap[t.id] = t
    );

    /* =========================
       LOAD BUNDLES
    ========================= */

    const bundleIds =
      items
        .filter(i => i.type === "bundle")
        .map(i => i.bundle_id);

    const bundles =
      await TicketBundles.findAll({

        where: { id: bundleIds },

        include: [
          {
            model: TicketBundleItem,
            as: "items"
          }
        ]

      });

    const bundleMap = {};

    bundles.forEach(
      b => bundleMap[b.id] = b
    );

    /* =========================
       GLOBAL
    ========================= */

    let creatorId = null;

    let ticketSubtotal = 0;

    let totalAdminFee = 0;

    let totalTax = 0;

    let buyerPayTotal = 0;

    let organizerNetTotal = 0;

    let adminFeeBearer = null;

    let taxBearer = null;

    /* =========================
       PROCESS ITEMS
    ========================= */

    for (const item of items) {

      /* ================= TICKET ================= */

      if (item.type === "ticket") {

        const t =
          ticketMap[item.ticket_type_id];

        if (!t)
          throw new Error("Ticket not found");

        const creatorFinance =
          await CreatorFinanceSettings.findOne({

            where: {
              creator_id: t.event.creator_id
            }

          });

        creatorId =
          t.event.creator_id;

        const price =
          Number(t.price);

        const qty =
          item.quantity;

        const subtotal =
          price * qty;

        /* admin fee */

        let adminFeeSingle = 0;

        if (creatorFinance.admin_fee_type === "flat")

          adminFeeSingle =
            Number(
              creatorFinance.admin_fee_value
            );

        else

          adminFeeSingle =
            price *
            (
              Number(
                creatorFinance.admin_fee_value
              ) / 100
            );

        const adminFeeTotal =
          adminFeeSingle * qty;

        /* tax */

        const taxTotal =
          price *
          TAX_RATE *
          qty;

        /* bearer */

        const buyerPaysAdmin =
          t.admin_fee_included == 1;

        const buyerPaysTax =
          t.tax_included == 1;

        adminFeeBearer =
          resolveBearer(
            adminFeeBearer,
            buyerPaysAdmin
          );

        taxBearer =
          resolveBearer(
            taxBearer,
            buyerPaysTax
          );

        /* total */

        let buyerTotal =
          subtotal;

        let organizerNet =
          subtotal;

        if (buyerPaysAdmin)

          buyerTotal +=
            adminFeeTotal;

        else

          organizerNet -=
            adminFeeTotal;

        if (buyerPaysTax)

          buyerTotal +=
            taxTotal;

        else

          organizerNet -=
            taxTotal;

        ticketSubtotal +=
          subtotal;

        totalAdminFee +=
          adminFeeTotal;

        totalTax +=
          taxTotal;

        buyerPayTotal +=
          buyerTotal;

        organizerNetTotal +=
          organizerNet;

      }

      /* ================= BUNDLE ================= */

      if (item.type === "bundle") {

        const bundle =
          bundleMap[item.bundle_id];

        if (!bundle)
          throw new Error("Bundle not found");

        const creatorFinance =
          await CreatorFinanceSettings.findOne({

            where: {
              creator_id: creatorId
            }

          });

        const subtotal =
          Number(bundle.price) *
          item.quantity;

        let bundleAdminFee = 0;

        let bundleTax = 0;

        for (const bItem of bundle.items) {

          const ticket =
            ticketMap[
            bItem.ticket_type_id
            ];

          const unitPrice =
            Number(ticket.price);

          const qty =
            bItem.quantity *
            item.quantity;

          let adminFeeSingle = 0;

          if (creatorFinance.admin_fee_type === "flat")

            adminFeeSingle =
              Number(
                creatorFinance.admin_fee_value
              );

          else

            adminFeeSingle =
              unitPrice *
              (
                Number(
                  creatorFinance.admin_fee_value
                ) / 100
              );

          bundleAdminFee +=
            adminFeeSingle * qty;

          bundleTax +=
            unitPrice *
            TAX_RATE *
            qty;

        }

        const buyerBundleTotal =
          subtotal +
          bundleAdminFee +
          bundleTax;

        ticketSubtotal +=
          subtotal;

        totalAdminFee +=
          bundleAdminFee;

        totalTax +=
          bundleTax;

        buyerPayTotal +=
          buyerBundleTotal;

        organizerNetTotal +=
          subtotal;

      }

    }

    return {

      total: ticketSubtotal,

      tax: totalTax,

      adminFee: totalAdminFee,

      grandTotal: buyerPayTotal

    };

  }

};

/* =========================
HELPERS
========================= */

function validateSaleTime(entity) {

  const now = new Date();

  if (now < new Date(entity.sale_start))
    throw new Error("Not yet on sale");

  if (now > new Date(entity.sale_end))
    throw new Error("Sale ended");

}

function validateMaxOrder(ticket, qty) {

  if (
    ticket.max_per_order &&
    qty > ticket.max_per_order
  )

    throw new Error(

      `Max ${ticket.max_per_order} ticket`

    );

}

function validateAttendeesExact(item) {

  if (
    !item.attendees ||
    item.attendees.length !== item.quantity
  )

    throw new Error(

      "Attendees must equal quantity"

    );

}

function resolveBearer(current, buyerPays) {

  if (current == null)

    return buyerPays
      ? "buyer"
      : "organizer";

  if (current === "mixed")
    return "mixed";

  if (
    current === "buyer" &&
    !buyerPays
  )
    return "mixed";

  if (
    current === "organizer" &&
    buyerPays
  )
    return "mixed";

  return current;

}