const service = require("../../services/fe/fend.service");

module.exports = {

    async homeAll(req, res) {
        res.json({ success: true, message: "Home data retrieved", data: await service.homeAll() });
    },

    async kategoriAll(req, res) {
        res.json({ success: true, message: "Kategori retrieved", data: await service.kategoriAll() });
    },

    async getEventByKategoriSlug(req, res) {
        try {

            const page = parseInt(req.query.page) || 1;

            const result = await service.getEventByKategoriSlug({
                slug: req.params.slug,
                page
            });

            res.json({
                message: "success",
                data: result
            });

        } catch (err) {
            res.status(500).json({
                message: "Failed retrieve event",
                error: err.message
            });
        }
    },

    async eventAll(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;

            const result = await service.eventAll({ page });

            res.json({
                message: "success",
                data: result
            });

        } catch (err) {
            res.status(500).json({
                message: "Failed retrieve event",
                error: err.message
            });
        }
    },

    async getOneEvent(req, res) {
        try {

            const data = await service.getOneEvent(req.params.slug);

            res.json({
                message: "success",
                data
            });

        } catch (err) {
            res.status(500).json({
                message: "Failed retrieve event",
                error: err.message
            });
        }
    },

    async getTicketEvent(req, res) {
        try {

            const data = await service.getTicketEvent(req.params.slug);

            res.json({
                message: "success",
                data
            });

        } catch (err) {
            res.status(500).json({
                message: "Failed retrieve ticket",
                error: err.message
            });
        }
    },

    async bannerAll(req, res) {
        res.json({ success: true, message: "Banner retrieved", data: await service.bannerAll() });
    },

    // search 
    async searchEvents(req, res) {

        try {

            const result = await service.searchEvents({
                page: parseInt(req.query.page) || 1,
                search: req.query.search,
                category: req.query.category,
                city: req.query.city,
                province: req.query.province,
                status: req.query.status,
                sort: req.query.sort
            });

            res.json({
                message: "success",
                data: result
            });

        } catch (err) {

            res.status(500).json({
                message: "Failed retrieve events",
                error: err.message
            });

        }

    },

    // dashboard
    async dashboard(req, res) {

        try {
            const result = await service.dashboard(req.customer.id);
            res.json({
                message: "success",
                data: result
            });
        } catch (err) {
            res.status(500).json({
                message: "Failed retrieve dashboard data",
                error: err.message
            });
        }
    }


}; 