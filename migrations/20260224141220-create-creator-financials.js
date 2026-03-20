'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('creator_financials', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("(UUID())"),
        allowNull: false,
        primaryKey: true
      },
      creator_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      total_income: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0 },
      total_payout: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0 },
      current_balance: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0 },
      pending_income: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0 },

      updated_at: Sequelize.DATE,
      created_at: Sequelize.DATE

    });
    await queryInterface.addIndex("creator_financials", ["creator_id"]);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('creator_financials');
  }
};