const router = require("express").Router();
const controller = require("../../controllers/fe/fend.controller");
const checkoutRoute = require("./checkout.route");
const paymentRoute = require("./payment.route");
const customerAuthRoute = require("./customerAuth.route");
const dashboardRoute = require("./dashboard/index.route");
const { cacheMiddleware } = require("../../middlewares/cache.middleware");
const jwtkey = require("../../middlewares/fendAuth.middleware");
router.get("/home", controller.homeAll);
router.get("/banner", cacheMiddleware({ ttl: 300 }),  controller.bannerAll);
router.get("/kategori", cacheMiddleware({ ttl: 300 }), controller.kategoriAll);
router.get("/kategori/:slug/events", cacheMiddleware({ ttl: 300 }), controller.getEventByKategoriSlug);
router.get("/event", cacheMiddleware({ ttl: 300 }), controller.eventAll);
router.get("/events", cacheMiddleware({ ttl: 300 }), controller.searchEvents);
router.get("/event/:slug", cacheMiddleware({ ttl: 300 }), controller.getOneEvent);
router.get("/event/tickets/:slug", controller.getTicketEvent);

router.use("/checkout", checkoutRoute);
router.use("/payment", paymentRoute);

router.use("/auth/customer", customerAuthRoute);
// dashboard route
router.use("/dashboard", jwtkey, dashboardRoute);

module.exports = router;
