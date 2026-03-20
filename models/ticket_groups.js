"use strict";

module.exports = (sequelize, DataTypes) => {
  const TicketGroup = sequelize.define(
    "TicketGroup",
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },

      creator_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },

      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },

      slug: {
        type: DataTypes.STRING(120),
        allowNull: false,
      },

      sort_order: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },

      is_default: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },

      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: "ticket_groups",
      underscored: true,
      timestamps: true,
    }
  );

  TicketGroup.associate = function (models) {

    /* optional relation */

    TicketGroup.belongsTo(models.Creator, {
      foreignKey: "creator_id",
      as: "creator",
    });

    TicketGroup.hasMany(models.TicketType, {
      foreignKey: "ticket_group_id",
      as: "tickets",
    });

  };

  return TicketGroup;
};