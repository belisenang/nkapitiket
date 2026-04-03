const Joi = require("joi");

exports.publishEventSchema = Joi.object({
  eventId: Joi.string().uuid().required()
});