// routes/settings.js

const router = require("express").Router();
const controller = require("../../controllers/dash/setting.controller");
const { creatorGuard } = require("../../middlewares/guard/role.guard");
const { autoFilterByCreator } = require("../../middlewares/autoFilterCreator.middleware");

const { cacheMiddleware } = require("../../middlewares/cache.middleware");
// Get tax rate
router.get("/", controller.getSettings);
router.get("/tax-rate", cacheMiddleware({ ttl: 300 }), creatorGuard("SUPER_ADMIN", "SYSTEM_ADMIN","PROMOTOR_OWNER","PROMOTOR_EVENT_ADMIN"), controller.getTaxRate);
router.get("/admin-fee", cacheMiddleware({ ttl: 300 }), creatorGuard("PROMOTOR_OWNER", "PROMOTOR_EVENT_ADMIN"), autoFilterByCreator(), controller.getAdminFee);

// Update tax rate
router.put("/tax-rate", creatorGuard("SUPER_ADMIN", "SYSTEM_ADMIN"), controller.updateTaxRate);
 
module.exports = router;