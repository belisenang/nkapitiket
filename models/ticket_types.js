module.exports = (sequelize, DataTypes) => {
  const TicketType = sequelize.define(
    "TicketType",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      ticket_group_id: DataTypes.UUID,
      event_id: DataTypes.UUID,
      name: DataTypes.STRING,
      deskripsi: DataTypes.TEXT,
      price: DataTypes.DECIMAL,
      total_stock: DataTypes.BIGINT,
      ticket_sold: DataTypes.BIGINT,
      max_per_order: DataTypes.BIGINT,
      reserved_stock: DataTypes.BIGINT,
      admin_fee_included: DataTypes.BOOLEAN,
      tax_included: DataTypes.BOOLEAN,
      status: DataTypes.ENUM("scheduled", "on_sale", "ended"),
      ticket_usage_type: DataTypes.ENUM("single_entry", "daily_entry", "multi_entry"),
      deliver_ticket: DataTypes.DATE,
      sale_start: DataTypes.DATE,
      sale_end: DataTypes.DATE,
      valid_start: DataTypes.DATE,
      valid_end: DataTypes.DATE,
    },
    {
      tableName: "ticket_types",
      paranoid: true,
      underscored: true,
    }
  );

  TicketType.associate = (models) => {
    TicketType.belongsTo(models.Event, {
      foreignKey: "event_id",
      as: "event",
    });
    TicketType.hasMany(models.Ticket, {
      foreignKey: "ticket_type_id",
      as: "tickets",
    });
    TicketType.belongsTo(models.TicketGroup, {
      foreignKey: "ticket_group_id",
      as: "group",
    });
  };

  return TicketType;
};
