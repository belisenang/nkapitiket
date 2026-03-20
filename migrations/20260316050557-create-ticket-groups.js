"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("ticket_groups", {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },

      creator_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },

      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },

      slug: {
        type: Sequelize.STRING(120),
        allowNull: false,
      },

      sort_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      is_default: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },

      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },

      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    /* INDEXES */

    await queryInterface.addIndex("ticket_groups", ["creator_id"]);

    await queryInterface.addIndex("ticket_groups", ["slug"]);

    await queryInterface.addIndex("ticket_groups", ["creator_id", "sort_order"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("ticket_groups");
  },
};