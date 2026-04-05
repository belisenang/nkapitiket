// controllers/settingsController.js

const settingsService = require("../../services/dash/setting.service");

module.exports = {
  async getSettings(req, res) {
    try {
      // const creator_id = req.user.creator_id;
      const creator_id = "176c5287-6b45-4f0f-801a-193c2d49afac";
      const settings = await settingsService.getSettings(creator_id);
      res.json({ success: true, data: settings });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // Ambil tarif pajak
  async getTaxRate(req, res) {
    try {
      const taxRate = await settingsService.getTaxRate(); // Memanggil service untuk ambil data pajak
      if (!taxRate) {
        return res.status(404).json({ success: false, message: "Pengaturan pajak tidak ditemukan" });
      }

      res.json({
        success: true,
        data: {
          tax_rate: taxRate.tax_rate,
          service_tax_rate: taxRate.service_tax_rate,
        },
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
  
  async getAdminFee(req, res) {
    try {
      const creator_id = req.user.creator_id
      const adminFee = await settingsService.getAdminFee(creator_id); // Memanggil service untuk ambil data pajak
      if (!adminFee) {
        return res.status(404).json({ success: false, message: "Admin Fee tidak ditemukan" });
      }

      res.json({
        success: true,
        data: adminFee,
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // Perbarui tarif pajak
  async updateTaxRate(req, res) {
    const { tax_rate, service_tax_rate } = req.body;

    try {
      await settingsService.updateTaxRate(tax_rate, service_tax_rate); // Memanggil service untuk memperbarui data pajak
      res.json({
        success: true,
        message: "Tarif pajak berhasil diperbarui",
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
};