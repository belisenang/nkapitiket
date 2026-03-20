"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("payments", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("(UUID())"),
        primaryKey: true,
      },

      order_id: Sequelize.UUID,
      provider: Sequelize.STRING,
      provider_transactions: Sequelize.STRING,

      // FINAL amount dibayar oleh buyer
      amount: Sequelize.DECIMAL(15, 2),

      // untuk audit jika payment gateway memotong biaya
      gateway_fee_amount: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0,
      },

      status: Sequelize.ENUM("pending", "paid", "failed"),
      payment_method: Sequelize.STRING,

      qris_payload: Sequelize.TEXT,
      qris_image_url: Sequelize.TEXT,
      qris_expired_at: Sequelize.DATE,

      raw_callback_log: Sequelize.TEXT,

      paid_at: Sequelize.DATE,

      created_at: Sequelize.DATE,
      updated_at: Sequelize.DATE,
    });
    
    await queryInterface.addIndex("payments", ["order_id"]);
    await queryInterface.addIndex("payments", ["status"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("payments");
  },
};