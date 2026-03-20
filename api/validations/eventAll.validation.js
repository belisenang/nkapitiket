const Joi = require("joi");

const ticketSchema = Joi.object({
  ticket_group_id: Joi.string().uuid().allow(null),
  name: Joi.string().required(),

  deskripsi: Joi.string().allow("", null),

  price: Joi.number().positive().required(),

  total_stock: Joi.number().integer().min(1).required(),

  max_per_order: Joi.number().integer().min(1).required(),

  status: Joi.string()
    .valid("scheduled", "on_sale", "ended")
    .default("scheduled"),

  admin_fee_included: Joi.boolean().default(true),

  tax_included: Joi.boolean().default(false),

  deliver_ticket: Joi.date().iso().required(),

  sale_start: Joi.date().iso().required(),
  sale_end: Joi.date().iso().required(),

  valid_start: Joi.date().iso().allow(null),
  valid_end: Joi.date().iso().allow(null),

  ticket_usage_type: Joi.string()
    .valid("single_entry", "daily_entry", "multi_entry")
    .default("single_entry"),
});

module.exports = {
  create: Joi.object({
    kategori_id: Joi.string().uuid().required(),

    name: Joi.string().required(),
    deskripsi: Joi.string().allow("", null),
    sk: Joi.string().allow("", null),

    date_start: Joi.date().allow(null),
    date_end: Joi.date().allow(null),
    time_start: Joi.string().allow(null),
    time_end: Joi.string().allow(null),
    timezone: Joi.string().allow(null), 

    location: Joi.string().allow("", null),
    map: Joi.string().allow("", null),
    province: Joi.string().allow("", null),
    district: Joi.string().allow("", null),
    keywords: Joi.string().allow("", null),
    status: Joi.string().valid("draft", "published", "ended").default("draft"),
    social_link: Joi.object().optional(),
    image: Joi.string().optional(),
    ticket_types: Joi.array().items(ticketSchema).min(1).required(),
  }),


};
