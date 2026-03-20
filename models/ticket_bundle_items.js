"use strict";

module.exports = (sequelize, DataTypes) => {

  const TicketBundleItem = sequelize.define(
    "TicketBundleItem",
    {

      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },

      bundle_id: {
        type: DataTypes.UUID,
        allowNull: false
      },

      ticket_type_id: {
        type: DataTypes.UUID,
        allowNull: false
      },

      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false
      }

    },
    {
      tableName: "ticket_bundle_items",
      underscored: true,
      timestamps: true
    }
  );

  TicketBundleItem.associate = (models) => {

    TicketBundleItem.belongsTo(models.TicketBundles, {
      foreignKey: "bundle_id",
      as: "bundle"
    });

    TicketBundleItem.belongsTo(models.TicketType, {
      foreignKey: "ticket_type_id",
      as: "ticket_type"
    });

  };

  return TicketBundleItem;
};