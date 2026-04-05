const router = require("express").Router();
const controller = require("../../controllers/fe/checkout.controller");

router.post("/", controller.checkout);

router.post(
  "/calculatetax",
  controller.calculateTax
);

module.exports = router;
