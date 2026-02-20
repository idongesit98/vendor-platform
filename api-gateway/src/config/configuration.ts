export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  },
  redis: {
    url: process.env.REDIS_URL,
  },
  services: {
    auth: {
      host: process.env.AUTH_SERVICE_HOST || 'localhost',
      port: parseInt(process.env.AUTH_SERVICE_PORT || '3001', 10),
    },
    user: {
      host: process.env.USER_SERVICE_HOST || 'localhost',
      port: parseInt(process.env.USER_SERVICE_PORT || '4000', 10),
    },
    menuitem: {
      host: process.env.MENUITEM_SERVICE_HOST || 'localhost',
      port: parseInt(process.env.MENUITEM_SERVICE_PORT || '4001', 10),
    },
    order: {
      host: process.env.ORDER_SERVICE_HOST || 'localhost',
      port: parseInt(process.env.ORDER_SERVICE_PORT || '4002', 10),
    },
    notification: {
      host: process.env.NOTIFICATION_SERVICE_HOST || 'localhost',
      port: parseInt(process.env.NOTIFICATION_SERVICE_PORT || '4003', 10),
    },
  },
});
