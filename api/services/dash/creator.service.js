const { Creator, User, Event, CreatorFinanceSettings, CreatorDocuments, CreatorBankAccounts, sequelize } = require("../../../models");
const deleteImage = require("../../utils/deleteImage");
const slugify = require("../../utils/slugify");
const { Op } = require("sequelize");
module.exports = {

  async getPagination({ page = 1, perPage = 10, search = "" }) {
    const limit = parseInt(perPage);
    const offset = (page - 1) * limit;

    const where = {};

    // Search by creator.name OR owner.full_name
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        sequelize.where(
          sequelize.col("owner.full_name"),
          { [Op.like]: `%${search}%` }
        )
      ];
    }

    const { rows, count } = await Creator.findAndCountAll({
      where,
      limit,
      offset,
      attributes: {
        include: [
          [
            sequelize.literal(`(
              SELECT COUNT(*)
              FROM events AS e
              WHERE e.creator_id = Creator.id
                AND e.deleted_at IS NULL
            )`),
            "total_events"
          ]
        ]
      },
      include: [
        {
          model: User,
          as: "owner",
          required: true, // owner harus ada
          attributes: ["full_name"]
        },
        {
          model: Event,
          as: "events",
          attributes: ["name", "slug", "image", "province", "district", "status", "date_start", "date_end", "time_start", "time_end", "timezone"]
        },
        {
          model: CreatorFinanceSettings,
          as: "financial",
          attributes: ["admin_fee_type", "admin_fee_value"]
        },
        {
          model: CreatorDocuments,
          as: "document",
          attributes: ["ktp_number", "npwp_number", "legal_type"]
        },
        {
          model: CreatorBankAccounts,
          as: "bank",
          attributes: ["is_verified"]
        }
      ],
      order: [["created_at", "DESC"]],
      distinct: true // fix count ketika ada include
    });

    return {
      rows,
      count,
      page,
      perPage: limit,
      totalPages: Math.ceil(count / limit)
    };
  },

  async getAll() {
    return await Creator.findAll({ order: [["created_at", "DESC"]] });
  },

  async getOne(id) {
    const data = await Creator.findByPk(id);
    if (!data) return null;
    data.image = data.image ? process.env.MEDIA_URL_AUTH + data.image : null;
    if (data.social_link) {
      try {
        data.social_link = JSON.parse(data.social_link);
      } catch (e) {
        data.social_link = null;
      }
    }
    return data;
  },

  async getBySlug(slug) {
    return await Creator.findOne({ where: { slug } });
  },

  async create(data) {
    data.slug = slugify(data.name);
    return await Creator.create(data);
  },

  async update(id, data) {
    const creator = await Creator.findByPk(id);
    if (!creator) throw new Error("Creator not found");

    if (data.name) data.slug = slugify(data.name);

    if (data.image && creator.image) {
      deleteImage(creator.image);
    }

    await creator.update(data);
    return creator;
  },

  async remove(id) {
    const creator = await Creator.findByPk(id);
    if (!creator) throw new Error("Creator not found");

    await creator.destroy();
    return { message: "Creator deleted" };
  },

  async approve(id, adminId) {

    const creator =
      await Creator.findByPk(id);

    if (!creator)
      throw new Error("Creator not found");

    await creator.update({

      is_active: true,
      approved_by: adminId || null,
      allowed_at: new Date()

    });

    return creator;

  }
};
