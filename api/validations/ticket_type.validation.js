const Joi = require("joi");

module.exports = {
  bulkCreate: Joi.array().items(
    Joi.object({
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
      deliver_ticket: Joi.date().required(),
      sale_start: Joi.date().required(),
      sale_end: Joi.date().required(),
      valid_start: Joi.date().allow(null),
      valid_end: Joi.date().allow(null),
      ticket_usage_type: Joi.string()
        .valid("single_entry", "daily_entry", "multi_entry")
        .default("single_entry"),
    })
  ),

  update: Joi.object({
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
    deliver_ticket: Joi.date().required(),
    sale_start: Joi.date().required(),
    sale_end: Joi.date().required(),
    valid_start: Joi.date().allow(null),
    valid_end: Joi.date().allow(null),
    ticket_usage_type: Joi.string()
      .valid("single_entry", "daily_entry", "multi_entry")
      .default("single_entry"),
  }),

  createBundle: Joi.array().items(
    Joi.object({

      name: Joi.string().max(150).required(),

      description: Joi.string().allow("", null),

      price: Joi.number().positive().required(),

      max_per_order: Joi.number().integer().min(1).default(10),

      status: Joi.string()
        .valid("draft", "available", "closed")
        .default("draft"),

      items: Joi.array().items(
        Joi.object({
          ticket_type_id: Joi.string().uuid().required(),
          quantity: Joi.number().integer().min(1).required()
        })
      ).min(1).required()

    })
  )

};