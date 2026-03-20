"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {

    await queryInterface.createTable("ticket_bundle_items", {

      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("(UUID())"),
        primaryKey: true
      },

      bundle_id: {
        type: Sequelize.UUID,
        allowNull: false
      },

      ticket_type_id: {
        type: Sequelize.UUID,
        allowNull: false
      },

      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false
      },

      created_at: Sequelize.DATE,
      updated_at: Sequelize.DATE

    });

    await queryInterface.addIndex("ticket_bundle_items", ["bundle_id"]);
    await queryInterface.addIndex("ticket_bundle_items", ["ticket_type_id"]);

  },

  async down(queryInterface) {
    await queryInterface.dropTable("ticket_bundle_items");
  }
};