export default () => ({
  port: parseInt(process.env.GATEWAY_PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  },
  redis: {
    url: process.env.REDIS_URL,
  },
  services: {
    user: {
      host: process.env.USER_SERVICE_HOST || 'localhost',
      port: parseInt(process.env.USER_SERVICE_PORT || '4000', 10),
    },
    menuitem: {
      host: process.env.MENU_SERVICE_HOST || 'localhost',
      port: parseInt(process.env.MENU_SERVICE_PORT || '4001', 10),
    },
    order: {
      host: process.env.ORDER_SERVICE_HOST || 'localhost',
      port: parseInt(process.env.ORDER_SERVICE_PORT || '4002', 10),
    },
    notification: {
      host: process.env.NOTIFICATION_SERVICE_HOST || 'localhost',
      port: parseInt(process.env.NOTIFICATION_SERVICE_PORT || '4003', 10),
    },
    payment: {
      host: process.env.PAYMENT_SERVICE_HOST || 'localhost',
      port: parseInt(process.env.PAYMENT_SERVICE_PORT || '4004', 10),
    },
  },
});
