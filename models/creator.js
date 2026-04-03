"use strict";
module.exports = (sequelize, DataTypes) => {
  const Creator = sequelize.define(
    "Creator",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      owner_user_id: DataTypes.UUID,
      name: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },

      slug: {
        type: DataTypes.TEXT,
        allowNull: false,
      },

      image: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      approved_by: {
        type: DataTypes.UUID,
        allowNull: true,
      },

      allowed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      social_link: {
        type: DataTypes.JSON,
        allowNull: true
      }
    },
    {
      tableName: "creators",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      paranoid: true,
      deletedAt: "deleted_at",
      underscored: true,
    }
  );

  Creator.associate = (models) => {
    // Owner
    Creator.belongsTo(models.User, {
      foreignKey: 'owner_user_id',
      as: 'owner'
    });

    // Members inside this creator
    Creator.hasMany(models.CreatorUserMember, {
      foreignKey: 'creator_id',
      as: 'members'
    });

    //event
    Creator.hasMany(models.Event, {
      foreignKey: 'creator_id',
      as: 'events'
    });

    Creator.hasOne(models.CreatorFinanceSettings, {
      foreignKey: "creator_id",
      as: "financial"
    });

    Creator.hasOne(models.CreatorBankAccounts, {
      foreignKey: "creator_id",
      as: "bank"
    });

    Creator.hasOne(models.CreatorDocuments, {
      foreignKey: "creator_id",
      as: "document"
    });

  };

  return Creator;
};
