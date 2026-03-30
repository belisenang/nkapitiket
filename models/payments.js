// models/Payment.js
"use strict";

module.exports = (sequelize, DataTypes) => {
  const Payment = sequelize.define(
    "Payment",
    {
      id: { type: DataTypes.UUID, primaryKey: true },

      order_id: DataTypes.UUID,

      provider: DataTypes.STRING,
      provider_transactions: DataTypes.STRING,

      amount: DataTypes.DECIMAL(15, 2),

      gateway_fee_amount: DataTypes.DECIMAL(15, 2),

      status: DataTypes.ENUM("pending", "paid", "failed"),
      payment_method: DataTypes.STRING,

      qris_payload: DataTypes.TEXT,
      qris_image_url: DataTypes.TEXT,
      qris_expired_at: DataTypes.DATE,

      raw_callback_log: DataTypes.TEXT,

      paid_at: DataTypes.DATE,
    },
    {
      tableName: "payments",
      createdAt: "created_at",
      updatedAt: "updated_at",
      underscored: true,
    }
  );

  Payment.associate = (models) => {
    Payment.belongsTo(models.Order, {
      foreignKey: "order_id",
      as: "order",
    });
  };

  return Payment;
};