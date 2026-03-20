"use strict";

module.exports = (sequelize, DataTypes) => {
  const Ticket = sequelize.define(
    "Ticket",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },

      ticket_code: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },

      order_item_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      creator_id: DataTypes.UUID,
      event_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      ticket_type_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      owner_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      owner_email: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      owner_phone: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      type_identity: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },

      no_identity: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },

      qr_payload: {
        type: DataTypes.TEXT,
        allowNull: false,
      },

      status: {
        type: DataTypes.ENUM(
          "pending",   // payment sukses, menunggu deliver_ticket
          "issued",    // QR & PDF dibuat
          "sent",      // email terkirim
          "used",      // sudah discan
          "expired",   // event lewat
          "revoked"    // dibatalkan admin
        ),
        defaultValue: "pending",
        allowNull: false,
      },

      issued_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      sent_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      used_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      used_by: {
        type: DataTypes.UUID,
        allowNull: true,
      },

      valid_start: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      
      valid_end: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "tickets",
      underscored: true,
      timestamps: true,
    }
  );

  Ticket.associate = (models) => {
    Ticket.belongsTo(models.OrderItem, { foreignKey: "order_item_id", as: "orderitem" });
    Ticket.belongsTo(models.Event, { foreignKey: "event_id", as: "event" });
    Ticket.belongsTo(models.TicketType, { foreignKey: "ticket_type_id", as: "ticket_type" });    
    Ticket.belongsTo(models.Creator, { foreignKey: "creator_id", as: "creators" });
  };

  return Ticket;
};
