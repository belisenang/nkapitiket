const service = require("../../services/dash/ticket_type.service");

module.exports = {

  async show(req, res) {
    const item = await service.getOne(req.params.ticketTypeId);
    if (!item) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: item });
  },

  async store(req, res) {
    try {
      const data = req.body.map(item => ({
        ...item,
        event_id: req.params.eventId
      }));

      const created = await service.create(data);

      res.status(201).json({ success: true, data: created });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async update(req, res) {
    try {
      const updated = await service.update(req.params.ticketTypeId, req.body);
      res.json({ success: true, data: updated });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async destroy(req, res) {
    try {
      const result = await service.remove(req.params.ticketTypeId);
      res.json({ success: true, message: "Deleted", data: result });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  },


  //ticket group
  async getTicketGroup(req, res) {

    const creatorId = req.user.creator_id;
    const item = await service.getTicketGroup(creatorId);
    if (!item) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: item });
  },

  async postTicketGroup(req, res) {
    try {
      const creatorId = req.user.creator_id;
      const created = await service.postTicketGroup(req.body, creatorId);

      res.status(201).json({ success: true, data: created });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  // =======================
  // TICKET BUNDLE
  // =======================

  async getTicketBundles(req, res) {
    try {

      const bundles = await service.getTicketBundles(req.params.eventId);

      res.json({
        success: true,
        data: bundles
      });

    } catch (err) {

      res.status(400).json({
        success: false,
        message: err.message
      });

    }
  },

  async createTicketBundle(req, res) {
    try {

      const payload = req.body.map(b => ({
        ...b,
        event_id: req.params.eventId
      }));

      const result = await service.createTicketBundlesBulk(payload);

      res.status(201).json({
        success: true,
        data: result
      });

    } catch (err) {
      res.status(400).json({
        success: false,
        message: err.message
      });
    }
  },

  async updateTicketBundle(req, res) {

    try {

      const bundle = await service.updateTicketBundle(
        req.params.bundleId,
        req.body
      );

      res.json({
        success: true,
        data: bundle
      });

    } catch (err) {

      res.status(400).json({
        success: false,
        message: err.message
      });

    }

  },

  async deleteTicketBundle(req, res) {

    try {

      await service.deleteTicketBundle(req.params.bundleId);

      res.json({
        success: true,
        message: "Bundle deleted"
      });

    } catch (err) {

      res.status(400).json({
        success: false,
        message: err.message
      });

    }

  },
};
