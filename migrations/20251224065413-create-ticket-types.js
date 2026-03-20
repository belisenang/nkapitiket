"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("ticket_types", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("(UUID())"),
        primaryKey: true,
      },
      ticket_group_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      event_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      deskripsi: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      price: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
      },
      total_stock: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      ticket_sold: {
        type: Sequelize.BIGINT,
        defaultValue: 0,
      },
      max_per_order: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      reserved_stock: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      admin_fee_included: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      tax_included: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      status: {
        type: Sequelize.ENUM("scheduled", "on_sale", "ended"),
        defaultValue: "scheduled"
      },
      ticket_usage_type: {
        type: Sequelize.ENUM("single_entry", "daily_entry", "multi_entry"),
        defaultValue: "single_entry"
      },
      deliver_ticket: Sequelize.DATE,
      sale_start: Sequelize.DATE,
      sale_end: Sequelize.DATE,
      valid_start: Sequelize.DATE,
      valid_end: Sequelize.DATE,

      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: { type: Sequelize.DATE, allowNull: true }
    });

    await queryInterface.addIndex("ticket_types", ["event_id"]);
    await queryInterface.addIndex("ticket_types", ["ticket_sold"]);
    await queryInterface.addIndex("ticket_types", ["status"]);
    await queryInterface.addIndex("ticket_types", ["sale_start"]);
    await queryInterface.addIndex("ticket_types", ["sale_end"]);
    await queryInterface.addIndex("ticket_types", ["ticket_usage_type"]);
    await queryInterface.addIndex("ticket_types", ["event_id", "ticket_sold"], {
      name: "idx_eventId_sold"
    });
    await queryInterface.addIndex("ticket_types", ["event_id", "status"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("ticket_types");
  },
};
