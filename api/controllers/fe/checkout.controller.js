const service = require("../../services/fe/checkout.service");

module.exports = {
  async checkout(req, res) {
    try {
      const result = await service.checkout(req.body);
      res.json({ success: true, message: "Checkout created", data: result });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async calculateTax(req, res) {

    try {

      const result =
        await service.calculateTax(req.body);

      res.json({

        success: true,

        message: "success",

        data: result

      });

    }

    catch (err) {

      res.status(400).json({

        success: false,

        message: err.message

      });

    }

  }
};
