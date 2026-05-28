import Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PAYMENT_PORT: Joi.number().default(3005),
  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().default('localhost'),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),
  RABBITMQ_URL: Joi.string().required(),
  PAYSTACK_SECRET_KEY: Joi.string().required(),
  PAYSTACK_PUBLIC_KEY: Joi.string().required(),
  PAYMENT_CALLBACK_URL: Joi.string().required(),
  WEBHOOKSECRET: Joi.string().required(),
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6399),
  REDIS_PASSWORD: Joi.string().required(),
  BASEURL: Joi.string().required(),
  ORDER_SERVICE_HOST: Joi.string().default('localhost'),
  ORDER_SERVICE_PORT: Joi.number().default(4002),
});
