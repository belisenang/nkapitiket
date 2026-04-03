const service = require("../../services/dash/creator.service");
const processImage = require("../../utils/imageProcessor");
const {
  CreatorDocuments,
  CreatorBankAccounts,
  CreatorFinanceSettings
} = require("../../../models");

const axios = require("axios");

module.exports = {

  async getPagination(req, res) {
    const { page = 1, perPage = 10, search = "" } = req.query;

    const result = await service.getPagination({ page, perPage, search });

    res.json({
      success: true,
      message: "Creators retrieved",
      media: process.env.MEDIA_URL,
      data: result.rows,
      meta: {
        page: Number(page),
        perPage: Number(perPage),
        totalItems: result.count,
        totalPages: result.totalPages
      }
    });
  },

  async index(req, res) {
    try {
      const data = await service.getAll();
      res.json({ success: true, message: "Creators retrieved", data });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async show(req, res) {
    try {
      const creator = await service.getOne(req.params.id);
      if (!creator) {
        return res.status(404).json({ success: false, message: "Creator not found" });
      }
      res.json({ success: true, message: "Creator found", data: creator });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async showBySlug(req, res) {
    try {
      const creator = await service.getBySlug(req.params.slug);
      if (!creator) {
        return res.status(404).json({ success: false, message: "Creator not found" });
      }
      res.json({ success: true, message: "Creator found", data: creator });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async store(req, res) {
    try {
      let imageUrl = null;

      if (req.file) {
        imageUrl = await processImage(req.file.buffer, "creators");
      }

      const creator = await service.create({
        user_id: req.body.user_id,
        name: req.body.name,
        image: imageUrl,
      });

      res.status(201).json({
        success: true,
        message: "Creator created",
        data: creator,
      });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async update(req, res) {
    try {
      let data = {
        name: req.body.name,
        social_link: req.body.social_link || null
      };

      if (req.file) {
        data.image = await processImage(req.file.buffer, "creators");
      }

      if (data.social_link && typeof data.social_link === "string") {
        data.social_link = JSON.parse(data.social_link);
      }

      const creator = await service.update(req.params.id, data);

      res.json({ success: true, message: "Creator updated", data: creator });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async destroy(req, res) {
    try {
      const result = await service.remove(req.params.id);
      res.json({ success: true, message: "Creator deleted", data: result });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  // GET DOCUMENTS
  async getDocuments(req, res) {
    const docs = await CreatorDocuments.findOne({ where: { creator_id: req.params.id } });
    res.json({ success: true, data: docs });
  },

  // GET BANK ACCOUNTS
  async getBankAccounts(req, res) {
    const bank = await CreatorBankAccounts.findAll({ where: { creator_id: req.params.id } });
    res.json({ success: true, data: bank });
  },

  // GET FINANCE
  async getFinanceSettings(req, res) {
    const finance = await CreatorFinanceSettings.findOne({
      where: { creator_id: req.params.id },
    });
    res.json({ success: true, data: finance });
  },

  // UPDATE / CREATE FINANCE
  async updateFinanceSettings(req, res) {
    const { admin_fee_type, admin_fee_value } = req.body;

    let finance = await CreatorFinanceSettings.findOne({
      where: { creator_id: req.params.id },
    });

    if (!finance) {
      finance = await CreatorFinanceSettings.create({
        creator_id: req.params.id,
        admin_fee_type,
        admin_fee_value,
      });
    } else {
      await finance.update({ admin_fee_type, admin_fee_value });
    }

    res.json({
      success: true,
      message: "Finance settings updated",
      data: finance,
    });
  },

  async upsertBankAccount(req, res) {

    const {

      bank_code,
      bank_name,
      account_number,
      account_holder_name

    } = req.body;


    let bank =
      await CreatorBankAccounts.findOne({

        where: {

          creator_id:
            req.params.id

        }

      });


    if (!bank) {

      bank =
        await CreatorBankAccounts.create({

          creator_id:
            req.params.id,

          bank_code,

          bank_name,

          account_number,

          account_holder_name

        });

    } else {

      await bank.update({

        bank_code,

        bank_name,

        account_number,

        account_holder_name,

        is_verified: false

      });

    }


    res.json({

      success: true,

      message:
        "Bank account saved",

      data: bank

    });

  },

  async verifyBankAccount(req, res) {

    const bank =
      await CreatorBankAccounts.findOne({

        where: {
          creator_id: req.params.id
        }

      });

    if (!bank)
      throw new Error("Bank not found");


    const response =
      await axios.post(

        "https://api.xendit.co/bank_accounts/validate",

        {

          account_number:
            bank.account_number,

          bank_code:
            bank.bank_code

        },

        {

          auth: {
            username: process.env.XENDIT_SECRET_KEY,
            password: ""
          }

        }

      );


    if (!response.data.is_valid) {

      throw new Error(
        "Invalid bank account"
      );

    }


    await bank.update({

      is_verified: true

    });


    res.json({

      success: true,
      message: "verified"

    });

  },

  async upsertDocuments(req, res) {

    let data = {

      creator_id:
        req.params.id,

      ktp_number:
        req.body.ktp_number,

      npwp_number:
        req.body.npwp_number,

      legal_type:
        req.body.legal_type,

      legal_name:
        req.body.legal_name

    };


    if (req.files?.ktp_image) {

      data.ktp_image =
        await processImage(

          req.files.ktp_image[0].buffer,

          "documents"

        );

    }


    if (req.files?.npwp_image) {

      data.npwp_image =
        await processImage(

          req.files.npwp_image[0].buffer,

          "documents"

        );

    }


    let doc =
      await CreatorDocuments.findOne({

        where: {

          creator_id:
            req.params.id

        }

      });


    if (!doc) {

      doc =
        await CreatorDocuments.create(data);

    } else {

      await doc.update(data);

    }


    res.json({

      success: true,

      message:
        "Documents saved",

      data: doc

    });

  }
};
