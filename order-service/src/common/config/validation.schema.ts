import Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('developement'),
  PORT: Joi.number().default(3003),
  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().default(5432),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),
  RABBITMQ_URL: Joi.string().required(),
  MENUITEM_SERVICE_HOST: Joi.string().default('localhost'),
  MENUITEM_SERVICE_PORT: Joi.number().default(4001),
});
