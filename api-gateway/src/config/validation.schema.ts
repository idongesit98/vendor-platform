import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('1h'),
  AUTH_SERVICE_HOST: Joi.string().default('localhost'),
  AUTH_SERVICE_PORT: Joi.number().default(3001),
  USER_SERVICE_HOST: Joi.string().default('localhost'),
  USER_SERVICE_PORT: Joi.number().default(3002),
  MENUITEM_SERVICE_HOST: Joi.string().default('localhost'),
  MENUITEM_SERVICE_PORT: Joi.number().default(3003),
  ORDER_SERVICE_HOST: Joi.string().default('localhost'),
  ORDER_SERVICE_PORT: Joi.number().default(3004),
  NOTIFICATION_HOST: Joi.string().default('localhost'),
  NOTIFICATION_PORT: Joi.number().default(3005),
});
