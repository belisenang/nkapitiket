const router = require("express").Router();
const apikey = require("../middlewares/apikey");
const jwtkey = require("../middlewares/authh.middleware");
const xenditVerify = require("../middlewares/xenditVerify.middleware");
const apikeyfend = require("../middlewares/apikeysfend");
const dashRoute = require("./dash/index.route");
const adminAuthRoute = require("./auth/adminAuth.route");
const fendRoute = require("./fe/fend.route");
const controllers = require("../controllers/fe/paymentCallback.controller");
const webhook = require("../webhook/payout.webhook");

router.use("/auth/admin", apikey, adminAuthRoute); 
router.use("/vi4",apikey, jwtkey, dashRoute);
router.use("/v1",apikeyfend, fendRoute);
router.post("/xendit-callback", xenditVerify, controllers.xenditCallback);
router.post("/xendit-payout-callback", xenditVerify, webhook.payoutWebhook);
router.use((req, res) => {
  res.status(404).json({
    status: false,
    message: "Route not found",
  });
});


module.exports = router;
