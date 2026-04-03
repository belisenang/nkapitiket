const router = require("express").Router();
const controller = require("../../../controllers/fe/dashboard/index.controller");
const upload = require("../../../middlewares/uploadImage.middleware");
router.get("/profile", controller.getDashboardProfile);

router.put("/profile", upload.fields([
    { name: "image", maxCount: 1 }
]), controller.updateDashboardProfile);

//orders 
router.get("/orders", controller.getPaginationOrders);
router.get(
    "/orders/:id",
    controller.getDetailOrder
);
module.exports = router;
