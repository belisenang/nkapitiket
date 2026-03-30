// models/Order.js
"use strict";

module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define(
    "Order",
    {
      id: { type: DataTypes.UUID, primaryKey: true },

      creator_id: DataTypes.UUID,
      code_order: DataTypes.STRING,

      customer_id: DataTypes.UUID,
      customer_name: DataTypes.STRING,
      customer_email: DataTypes.STRING,
      customer_phone: DataTypes.STRING,
      type_identity: DataTypes.STRING,
      no_identity: DataTypes.STRING,

      // FINANCE
      ticket_subtotal: DataTypes.DECIMAL(15, 2),
      admin_fee_amount: DataTypes.DECIMAL(15, 2),
      tax_amount: DataTypes.DECIMAL(15, 2),

      buyer_pay_total: DataTypes.DECIMAL(15, 2),
      organizer_net_total: DataTypes.DECIMAL(15, 2),

      admin_fee_bearer: DataTypes.ENUM("buyer", "organizer","mixed"),
      tax_bearer: DataTypes.ENUM("buyer", "organizer","mixed"),

      status: DataTypes.ENUM("pending", "waiting_payment", "paid", "expired", "canceled"),
      payment_method: DataTypes.STRING,
      expired_at: DataTypes.DATE,
    },
    {
      tableName: "orders",
      createdAt: "created_at",
      updatedAt: "updated_at",
      underscored: true,
    }
  );

  Order.associate = (models) => {
    // Order ← CustomerUser
    Order.belongsTo(models.CustomerUser, {
      foreignKey: "customer_id",
      as: "customer",
    });

    // Order ←→ OrderItems
    Order.hasMany(models.OrderItem, {
      foreignKey: "order_id",
      as: "items",
    });

    // Order ←→ Payment
    Order.hasMany(models.Payment, {
      foreignKey: "order_id",
      as: "payments",
    });

    // Order ←→ Tickets (melalui order_item_id)
    Order.hasMany(models.Ticket, {
      foreignKey: "order_item_id",
      as: "tickets",
    });
  };

  return Order;
};