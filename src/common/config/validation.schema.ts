import Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3005),
  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().default('localhost'),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),
  RABBITMQURL: Joi.string().required(),
  PAYSTACKSECRETKEY: Joi.string().required(),
  PAYSTACKPUBLICKEY: Joi.string().required(),
  WEBHOOKSECRET: Joi.string().required(),
  BASEURL: Joi.string().required(),
  ORDER_SERVICE_HOST: Joi.number().default(3003),
  ORDER_SERVICE_PORT: Joi.number().default(4002),
});
