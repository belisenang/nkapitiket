const Joi = require("joi");

module.exports = {
  create: Joi.object({
    owner_user_id: Joi.string().required(),
    name: Joi.string().required(),
  }),
 
  update: Joi.object({
    name: Joi.string().optional(),
    social_link: Joi.object().optional(),
    image: Joi.string().optional(),
  }),

  // validations/creator.validation.js

  bankAccount: Joi.object({

    bank_code:
      Joi.string().required(),

    bank_name:
      Joi.string().required(),

    account_number:
      Joi.string().min(5).required(),

    account_holder_name:
      Joi.string().required()

  }),

  documents: Joi.object({

    ktp_number:
      Joi.string().required(),

    npwp_number:
      Joi.string().required(),

    legal_type:
      Joi.string().allow(null, ""),

    legal_name:
      Joi.string().allow(null, "")

  })
};
