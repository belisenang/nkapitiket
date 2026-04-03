const router = require("express").Router();
const userRoute = require("./user.route");
const kategoriRoute = require("./kategori.route");
const creatorRoute = require("./creator.route");
const eventRoute = require("./event.route");
const ticket_typeRoute = require("./ticket_type.route");
const bannerRoute = require("./banner.route");
const regionRoute = require("./region.route");
const promotorRoute = require("./promotor.route");
const fasilitasRoute = require("./fasilitas.route");
const ordersRoute = require("./order.route");
const payoutsRoute = require("./payout.route");
const settingsRoute = require("./setting.route");
const payoutAdminRoute = require("./payoutAdmin.route")
const imageUploads = require("./imageUpload.route")
const staffRoute = require("./scan/staff.route")
const scanRoute = require("./scan/scanner.route")
const eventApproval = require("./eventApproval.routes")
const organizerDashboard = require("./organizer.dashboard.routes")

router.use("/users", userRoute);
router.use("/kategoris", kategoriRoute);
router.use("/creators", creatorRoute);
router.use("/events", eventRoute);
router.use("/ticket-types", ticket_typeRoute);
router.use("/regions", regionRoute);
router.use("/banners", bannerRoute);
router.use("/promotors", promotorRoute);
router.use("/fasilitas", fasilitasRoute);
router.use("/orders", ordersRoute);
router.use("/payout", payoutsRoute);
router.use("/settings", settingsRoute);
router.use("/payoutAdmin", payoutAdminRoute);
router.use("/upload", imageUploads);
router.use("/staffs", staffRoute);
router.use("/scanner", scanRoute);
router.use("/event-approval", eventApproval);
router.use("/dashboard", organizerDashboard);

module.exports = router;