const router = require("express").Router();
const controller = require("../../controllers/dash/organizer.dashboard.controller");
const { creatorGuard } = require("../../middlewares/guard/role.guard");

router.get(
    "/promotor-owner",
    creatorGuard("PROMOTOR_OWNER"),
    controller.dashboardPromotorOwner
);
module.exports = router;