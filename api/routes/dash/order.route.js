const router = require("express").Router();
const controller = require("../../controllers/dash/order.controller");

router.get("/export/csv", controller.exportCSV);
router.get("/export/xlsx", controller.exportXLSX);
router.get("/export/pdf", controller.exportPDF);
router.get("/pagination", controller.pagination);
router.get("/:id", controller.detail);
router.post("/:id/resend", controller.resendTicket);
module.exports = router; 