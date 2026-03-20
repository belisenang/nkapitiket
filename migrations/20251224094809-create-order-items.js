"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("order_items", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("(UUID())"),
        allowNull: false,
        primaryKey: true,
      },

      order_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },

      ticket_type_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },

      quantity: Sequelize.BIGINT,

      // ====== FINANCE PER ITEM ======
      ticket_price: Sequelize.DECIMAL(15, 2),
      admin_fee_amount: Sequelize.DECIMAL(15, 2),
      tax_amount: Sequelize.DECIMAL(15, 2),

      // total bayar buyer (untuk item ini)
      buyer_pay_amount: Sequelize.DECIMAL(15, 2),

      // pendapatan organizer dari item ini
      organizer_net: Sequelize.DECIMAL(15, 2),

      attendees: Sequelize.JSON,

      created_at: Sequelize.DATE,
      updated_at: Sequelize.DATE,
    });
    await queryInterface.addIndex("order_items", ["order_id"]);
    await queryInterface.addIndex("order_items", ["ticket_type_id"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("order_items");
  },
};