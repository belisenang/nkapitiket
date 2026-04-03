const service = require("../../services/dash/event.service");
const processImage = require("../../utils/imageProcessor");

module.exports = {
  async getPagination(req, res) {
    const { page = 1, perPage = 10, search = "", status } = req.query;

    const result = await service.getPagination({
      page,
      perPage,
      search,
      status,
      creator_id: req.filterCreator,
    });

    res.json({
      success: true,
      message: "Event retrieved",
      media: process.env.MEDIA_URL,
      data: result.rows,
      meta: {
        page: Number(page),
        perPage: Number(perPage),
        totalItems: result.count,
        totalPages: result.totalPages,
      },
    });
  },

  async index(req, res) {
    try {
      const data = await service.getAll(req.filterCreator);
      res.json({
        success: true,
        message: "Events retrieved",
        data: data,
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message, media: process.env.MEDIA_URL });
    }
  },

  async show(req, res) {
    try {
      const data = await service.getOne(req.params.eventId);
      if (!data) {
        return res.status(404).json({ success: false, message: "Event not found" });
      }
      res.json({ success: true, message: "Event found", data, media: process.env.MEDIA_URL });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async slug(req, res) {
    try {
      const data = await service.getBySlug(req.params.slug);
      if (!data) {
        return res.status(404).json({ success: false, message: "Event not found" });
      }
      res.json({ success: true, message: "Event found", data, media: process.env.MEDIA_URL });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
 
  async store(req, res) {
    try {
      const data = { ...req.body };

      if (req.files?.image) {
        data.image = await processImage(req.files.image[0].buffer, "events");
      }
      if (req.files?.layout_venue) {
        data.layout_venue = await processImage(
          req.files.layout_venue[0].buffer,
          "events"
        );
      }

      const event = await service.create(data);

      res.status(201).json({
        success: true,
        message: "Event created",
        data: event,
      });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async storeAll(req, res) {
    try {

      const data = { ...req.body };

      if (req.files?.image?.length) {
        data.image = await processImage(
          req.files.image[0].buffer,
          "events"
        );
      }

      if (req.files?.layout_venue?.length) {
        data.layout_venue = await processImage(
          req.files.layout_venue[0].buffer,
          "events"
        );
      }

      if (data.social_link && typeof data.social_link === "string") {
        data.social_link = JSON.parse(data.social_link);
      }

      data.user_id = req.user.id;
      data.creator_id = req.user.creator_id;
      const event = await service.createAll(data);

      return res.status(201).json({
        success: true,
        message: "Event created successfully",
        data: event,
      });

    } catch (err) {
      console.error("Create Event Error:", err);

      return res.status(400).json({
        success: false,
        message: err.message || "Failed to create event",
      });
    }
  },

  async update(req, res) {
    try {
      const data = { ...req.body };

      if (req.files?.image) {
        data.image = await processImage(
          req.files.image[0].buffer,
          "events"
        );
      }

      if (req.files?.layout_venue) {
        data.layout_venue = await processImage(
          req.files.layout_venue[0].buffer,
          "events"
        );
      }

      if (data.social_link && typeof data.social_link === "string") {
        data.social_link = JSON.parse(data.social_link);
      }

      const event = await service.update(req.params.eventId, data);

      res.json({ success: true, message: "Event updated", data: event });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async destroy(req, res) {
    try {
      const response = await service.remove(req.params.eventId);
      res.json({ success: true, message: "Event deleted", data: response });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async addGuestStar(req, res) {
    try {
      let image = null;
      if (req.file) {
        image = await processImage(req.file.buffer, "guest-stars");
      }
      const data = await service.createGuestStar({
        event_id: req.params.eventId,
        name: req.body.name,
        image
      });
      res.json({ success: true, message: "Guest star added", data });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async removeGuestStar(req, res) {
    try {
      await service.deleteGuestStar(req.params.guestId);
      res.json({ success: true, message: "Guest star removed" });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async addSponsor(req, res) {
    try {
      let image = null;
      if (req.file) {
        image = await processImage(req.file.buffer, "sponsors");
      }
      const data = await service.createSponsor({
        event_id: req.params.eventId,
        name: req.body.name,
        image
      });
      res.json({ success: true, message: "Sponsor added", data });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async removeSponsor(req, res) {
    try {
      await service.deleteSponsor(req.params.sponsorId);
      res.json({ success: true, message: "Sponsor removed" });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async addFasilitas(req, res) {
    try {
      await service.addFasilitasToEvent(req.params.eventId, req.body.fasilitas_id);
      res.json({ success: true, message: "Fasilitas added" });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async removeFasilitas(req, res) {
    try {
      await service.removeFasilitasFromEvent(req.params.eventId, req.params.fasilitasId);
      res.json({ success: true, message: "Fasilitas removed" });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async assignScanStaff(req, res) {
    try {

      const data = await service.assignScanStaff({
        event_id: req.params.eventId,
        user_id: req.body.user_id,
        gate: req.body.gate,
        creator_id: req.user.creator_id,
        created_by: req.user.id
      });

      res.json({
        success: true,
        message: "Scan staff assigned",
        data
      });

    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async removeScanStaff(req, res) {
    try {

      await service.removeScanStaff(req.params.assignmentId);

      res.json({
        success: true,
        message: "Scan staff removed"
      });

    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  },
};
