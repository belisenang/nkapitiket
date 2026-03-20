const { TicketType, TicketGroup, Event, TicketBundles, TicketBundleItem, sequelize } = require("../../../models");
const { Op } = require("sequelize");
module.exports = {

  async getOne(ticketTypeId) {
    return await TicketType.findByPk(ticketTypeId);
  },

  async create(data) {
    const transaction = await sequelize.transaction();

    try {
      // data adalah ARRAY langsung
      const tickets = data.map(t => ({
        ...t,
        event_id: data[0].event_id
      }));

      const created = await TicketType.bulkCreate(tickets, { transaction });

      const allTickets = await TicketType.findAll({
        where: { event_id: data[0].event_id },
        transaction
      });

      const lowestPrice = Math.min(...allTickets.map(t => t.price));

      await Event.update(
        { lowest_price: lowestPrice },
        { where: { id: data[0].event_id }, transaction }
      );

      await transaction.commit();
      return created;

    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async update(ticketTypeId, data) {
    const ticket = await TicketType.findByPk(ticketTypeId);
    if (!ticket) throw new Error("Ticket type not found");

    await ticket.update(data);
    const tickets = await TicketType.findAll({
      where: { event_id: ticket.event_id }
    });

    const lowestPrice = Math.min(...tickets.map(t => t.price));

    await Event.update(
      { lowest_price: lowestPrice },
      { where: { id: ticket.event_id } }
    );
    return ticket;
  },

  async remove(id) {
    const ticket = await TicketType.findByPk(id);
    if (!ticket) throw new Error("Ticket type not found");

    const eventId = ticket.event_id;
    await ticket.destroy();

    const tickets = await TicketType.findAll({ where: { event_id: eventId } });

    const lowestPrice = tickets.length
      ? Math.min(...tickets.map(t => t.price))
      : null;

    await Event.update(
      { lowest_price: lowestPrice },
      { where: { id: eventId } }
    );

    return { message: "Ticket deleted" };
  },

  // ticket group
  async getTicketGroup(creatorId) {
    const groups = await TicketGroup.findAll({
      where: {
        [Op.or]: [
          { creator_id: null },
          { creator_id: creatorId }
        ],
        is_active: true
      },
      order: [["sort_order", "ASC"]],
      attributes: ["id", "name"]
    });
    return groups;
  },

  async postTicketGroup(data, creatorId) {
    return await TicketGroup.create({
      creator_id: creatorId,
      name: data.name
    });
  },

  // ===============================
  // GET BUNDLES
  // ===============================

  async getTicketBundles(eventId) {

    return await TicketBundles.findAll({

      where: { event_id: eventId },

      include: [{
        model: TicketBundleItem,
        as: "items"
      }]

    });

  },

  // ===============================
  // CREATE BUNDLE
  // ===============================

  async createTicketBundlesBulk(data) {

    const transaction = await sequelize.transaction();

    try {

      const bundles = await TicketBundles.bulkCreate(
        data.map(b => ({
          event_id: b.event_id,
          name: b.name,
          description: b.description,
          price: b.price,
          max_per_order: b.max_per_order,
          status: b.status || "draft"
        })),
        { returning: true, transaction }
      );

      const allItems = [];

      bundles.forEach((bundle, index) => {

        const items = data[index].items || [];

        items.forEach(i => {
          allItems.push({
            bundle_id: bundle.id,
            ticket_type_id: i.ticket_type_id,
            quantity: i.quantity
          });
        });

      });

      if (allItems.length > 0) {
        await TicketBundleItem.bulkCreate(allItems, { transaction });
      }

      await transaction.commit();

      return bundles;

    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  // ===============================
  // UPDATE BUNDLE
  // ===============================

  async updateTicketBundle(bundleId, data) {

    const transaction = await sequelize.transaction();

    try {

      const bundle = await TicketBundles.findByPk(bundleId);

      if (!bundle) throw new Error("Bundle not found");

      await bundle.update({

        name: data.name,
        price: data.price,
        description: data.description,
        max_per_order: data.max_per_order,
        status: data.status

      }, { transaction });

      if (data.items) {

        await TicketBundleItem.destroy({
          where: { bundle_id: bundleId },
          transaction
        });

        const items = data.items.map(i => ({
          bundle_id: bundleId,
          ticket_type_id: i.ticket_type_id,
          quantity: i.quantity
        }));

        await TicketBundleItem.bulkCreate(items, { transaction });

      }

      await transaction.commit();

      return bundle;

    } catch (err) {

      await transaction.rollback();
      throw err;

    }

  },

  // ===============================
  // DELETE BUNDLE
  // ===============================

  async deleteTicketBundle(bundleId) {

    const transaction = await sequelize.transaction();

    try {

      await TicketBundleItem.destroy({
        where: { bundle_id: bundleId },
        transaction
      });

      await TicketBundles.destroy({
        where: { id: bundleId },
        transaction
      });

      await transaction.commit();

    } catch (err) {

      await transaction.rollback();
      throw err;

    }

  },

};
