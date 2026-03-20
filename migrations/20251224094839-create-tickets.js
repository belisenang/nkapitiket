"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("tickets", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("(UUID())"),
        primaryKey: true,
        allowNull: false,
      },
 
      ticket_code: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },

      order_item_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },

      creator_id: { type: Sequelize.UUID, allowNull: false },
      event_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },

      ticket_type_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },

      owner_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },

      owner_email: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },

      owner_phone: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },

      type_identity: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },

      no_identity: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },

      qr_payload: {
        type: Sequelize.TEXT,
        allowNull: false,
      },

      status: {
        type: Sequelize.ENUM(
          "pending",   // payment ok, menunggu deliver_ticket
          "issued",    // QR & PDF generated
          "sent",      // email terkirim
          "used",      // sudah discan
          "expired",   // event selesai
          "revoked"    // dibatalkan admin
        ),
        defaultValue: "pending",
        allowNull: false,
      },

      issued_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      sent_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      used_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      used_by: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      valid_start: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      valid_end: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },

      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
    });

    // INDEXES (WAJIB UNTUK PERFORMA)
    await queryInterface.addIndex("tickets", ["ticket_code"]);
    await queryInterface.addIndex("tickets", ["order_item_id"]);
    await queryInterface.addIndex("tickets", ["event_id"]);
    await queryInterface.addIndex("tickets", ["status"]);    
    await queryInterface.addIndex("tickets", ["sent_at"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("tickets");
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_tickets_status";'
    );
  },
};
