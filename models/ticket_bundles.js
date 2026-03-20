"use strict";

module.exports = (sequelize, DataTypes) => {
  const TicketBundles = sequelize.define(
    "TicketBundles",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },

      event_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      name: {
        type: DataTypes.STRING(150),
        allowNull: false
      },

      description: {
        type: DataTypes.TEXT
      },

      price: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false
      },

      max_per_order: {
        type: DataTypes.INTEGER,
        defaultValue: 10
      },

      status: {
        type: DataTypes.ENUM("draft", "available", "closed"),
        defaultValue: "draft"
      },
    },
    {
      tableName: "ticket_bundles",
      underscored: true,
      timestamps: true,
    }
  );

  TicketBundles.associate = (models) => {

    TicketBundles.belongsTo(models.Event, {
      foreignKey: "event_id",
      as: "event"
    });

    TicketBundles.hasMany(models.TicketBundleItem, {
      foreignKey: "bundle_id",
      as: "items"
    });

  };

  return TicketBundles;
};
