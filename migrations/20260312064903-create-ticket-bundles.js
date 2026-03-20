
"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {

    await queryInterface.createTable("ticket_bundles", {

      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("(UUID())"),
        primaryKey: true
      },

      event_id: {
        type: Sequelize.UUID,
        allowNull: false
      },

      name: {
        type: Sequelize.STRING(150),
        allowNull: false
      },

      description: {
        type: Sequelize.TEXT
      },

      price: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },

      max_per_order: {
        type: Sequelize.INTEGER,
        defaultValue: 10
      },

      status: {
        type: Sequelize.ENUM("draft", "available", "closed"),
        defaultValue: "draft"
      },

      created_at: Sequelize.DATE,
      updated_at: Sequelize.DATE

    });

    await queryInterface.addIndex("ticket_bundles", ["event_id"]);
    await queryInterface.addIndex("ticket_bundles", ["event_id", "status"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("ticket_bundles");
  }
};