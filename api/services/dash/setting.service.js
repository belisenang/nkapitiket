const { SystemFinanceSettings, CreatorFinanceSettings, TicketGroup } = require("../../../models");
const { Op } = require("sequelize");
module.exports = {

  async getSettings(creator_id) {
    const taxRate = await SystemFinanceSettings.findOne();
    const adminFees = await CreatorFinanceSettings.findOne({ where: { creator_id } });
    const groups = await TicketGroup.findAll({
      where: {
        [Op.or]: [
          { creator_id: null },
          { creator_id: creator_id }
        ],
        is_active: true
      },
      order: [["sort_order", "ASC"]],
      attributes: ["id", "name"]
    });
    return {
      tax_rate: taxRate ? taxRate.tax_rate : null,
      adminFees,
      groups
    };
  },

  // Ambil data pajak saat ini
  async getTaxRate() {
    return await SystemFinanceSettings.findOne(); // Mengambil 1 record karena hanya ada satu pengaturan
  },

  async getAdminFee(creator_id) {
    const data = await CreatorFinanceSettings.findOne({ where: { creator_id } })
    return data;
  },

  // Memperbarui tarif pajak
  async updateTaxRate(tax_rate, service_tax_rate) {
    const systemFinanceSetting = await SystemFinanceSettings.findOne();

    if (!systemFinanceSetting) {
      throw new Error("Pengaturan pajak tidak ditemukan");
    }

    systemFinanceSetting.tax_rate = tax_rate;
    systemFinanceSetting.service_tax_rate = service_tax_rate;

    // Simpan perubahan ke database
    await systemFinanceSetting.save();
  },
};