"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("creators", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("(UUID())"),
        allowNull: false,
        primaryKey: true,
      },

      owner_user_id: {
        type: Sequelize.UUID,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },

      slug: {
        type: Sequelize.TEXT,
        allowNull: false,
      },

      image: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      approved_by: {
        type: Sequelize.UUID,
        allowNull: true,
      },

      allowed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      social_link: {
        type: Sequelize.JSON,
        allowNull: true,
      },

      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },

      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },

      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("creators");
  },
};
