const service = require("../../services/dash/organizer.dashboard.service");

module.exports = {

    async dashboardPromotorOwner(req, res) {

        const creatorId = req.user.creator_id;

        const data =
            await service.getDashboard(creatorId);

        res.json(data);

    }

};