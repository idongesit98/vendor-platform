import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  GATEWAY_PORT: Joi.number().default(3000),
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('1h'),
  USER_SERVICE_HOST: Joi.string().default('localhost'),
  USER_SERVICE_PORT: Joi.number().default(4000),
  MENU_SERVICE_HOST: Joi.string().default('localhost'),
  MENU_SERVICE_PORT: Joi.number().default(4001),
  ORDER_SERVICE_HOST: Joi.string().default('localhost'),
  ORDER_SERVICE_PORT: Joi.number().default(4002),
  NOTIFICATION_HOST: Joi.string().default('localhost'),
  NOTIFICATION_PORT: Joi.number().default(4003),
});
