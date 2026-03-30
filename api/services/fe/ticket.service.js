// services/fe/ticket.service.js

const {
  Event,
  Ticket,
  OrderItem,
  TicketType,
  TicketBundles,
  TicketBundleItem
} = require("../../../models");

const crypto = require("crypto");
const { generateSignature } = require("../../utils/qrSignature");

module.exports = { 

  async generateTickets(orderId, transaction) {

    const items = await OrderItem.findAll({

      where: { order_id: orderId },

      include: [

        {
          model: TicketType,
          as: "ticket_type",
          attributes: ["id", "event_id"]
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

      ],

      transaction

    });

    if (!items.length) return;

    const payload = [];

    for (const item of items) {

      /* =========================
         DIRECT TICKET
      ========================= */

      if (item.item_type === "ticket") {

        const attendees =
          parseAttendees(item.attendees);

        for (const a of attendees) {

          payload.push(

            buildTicketPayload({

              orderItemId: item.id,

              eventId:
                item.ticket_type.event_id,

              ticketTypeId:
                item.ticket_type_id,

              attendee: a

            })

          );

        }

      }

      /* =========================
         BUNDLE
      ========================= */

      if (item.item_type === "bundle") {

        const attendees =
          parseAttendees(item.attendees);

        const bundle =
          item.ticket_bundles;

        const ticketTypeIds =
          bundle.items.map(
            i => i.ticket_type_id
          );

        /* load ticket type */

        const ticketTypes =
          await TicketType.findAll({

            where: {
              id: ticketTypeIds
            },

            attributes: [
              "id",
              "event_id"
            ],

            transaction

          });

        const ticketMap = {};

        ticketTypes.forEach(t => {

          ticketMap[t.id] = t;

        });

        let pointer = 0;

        for (const bItem of bundle.items) {

          const ticketType =
            ticketMap[
            bItem.ticket_type_id
            ];

          const totalTicket =
            bItem.quantity *
            item.quantity;

          for (let i = 0; i < totalTicket; i++) {

            const attendee =
              attendees[pointer++];

            payload.push(

              buildTicketPayload({

                orderItemId: item.id,

                eventId:
                  ticketType.event_id,

                ticketTypeId:
                  ticketType.id,

                attendee

              })

            );

          }

        }

      }

    }

    if (!payload.length) return;

    await Ticket.bulkCreate(
      payload,
      {
        transaction,
        validate: true
      }
    );

  }

};


/* =========================
   HELPERS
========================= */

function parseAttendees(raw) {

  if (!raw) return [];

  if (Array.isArray(raw))
    return raw;

  return JSON.parse(raw);

}


function buildTicketPayload({
  orderItemId,
  eventId,
  ticketTypeId,
  attendee
}) {

  const code =
    "BLSNG-" +
    crypto.randomBytes(8).toString("hex");

  const signature =
    generateSignature(code, eventId);

  return {

    order_item_id: orderItemId,

    event_id: eventId,

    ticket_type_id: ticketTypeId,

    ticket_code: code,

    owner_name: attendee.name,

    owner_email: attendee.email,

    owner_phone: attendee.phone,

    type_identity: attendee.type_identity,

    no_identity: attendee.no_identity,

    qr_payload: JSON.stringify({

      t: code,
      e: eventId,
      s: signature

    }),

    status: "issued",

    issued_at: new Date()

  };

}