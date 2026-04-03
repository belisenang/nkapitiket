const service = require("../../../services/fe/dashboard/index.service");
const processImage = require("../../../utils/imageProcessor");

module.exports = {
    async getDashboardProfile(req, res) {
        try {
            const result = await service.getDashboardProfile(req.user.id);
            res.json({ success: true, message: "Profile retrieved", data: result });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },

    async updateDashboardProfile(req, res) {
        try {
            const data = { ...req.body };
            if (req.files?.image) {
                data.image = await processImage(req.files.image[0].buffer, "customer_profiles");
            }
            const result = await service.updateDashboardProfile(req.user.id, data);
            res.json({ success: true, message: "Profile updated", data: result });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },

    // order 
    async getPaginationOrders(req, res) {

        try {
            const customer_id = req.user.id;

            const event_id =
                req.query.event_id && req.query.event_id !== "ALL"
                    ? req.query.event_id
                    : null;

            const payment_method =
                req.query.payment_method && req.query.payment_method !== "ALL"
                    ? req.query.payment_method
                    : null;

            const start_date =
                req.query.start_date && req.query.start_date !== "null"
                    ? req.query.start_date
                    : null;

            const end_date =
                req.query.end_date && req.query.end_date !== "null"
                    ? req.query.end_date
                    : null;

            const result = await service.getPaginationOrders({

                page: req.query.page,

                perPage: req.query.perPage,

                search: req.query.search,

                status: req.query.status,

                customer_id,

                event_id,

                payment_method,

                start_date,

                end_date

            });

            return res.json({
                success: true,
                message: "Orders retrieved",
                data: result.rows,
                meta: {
                    page: Number(result.page),
                    perPage: Number(result.perPage),
                    totalItems: result.count,
                    totalPages: result.totalPages,
                },
            });
        } catch (err) {
            return res.status(400).json({ success: false, message: err.message });
        }
    },

    async getDetailOrder(req, res) {

        try {

            const result =
                await service.getDetailOrder(

                    req.params.id,

                    req.user.id

                );

            res.json({

                success: true,

                message:
                    "Order detail retrieved",

                data: result

            });

        }

        catch (err) {

            res.status(400).json({

                success: false,

                message: err.message

            });

        }

    },
};