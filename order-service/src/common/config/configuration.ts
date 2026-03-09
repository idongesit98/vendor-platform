export default () => ({
  port: parseInt(process.env.PORT || '3003', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5434', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'idongesit98',
    name: process.env.DB_NAME || 'order_db',
  },
  services: {
    menuitem: {
      host: process.env.MENUITEM_SERVICE_HOST || 'localhost',
      port: parseInt(process.env.MENUITEM_SERVICE_PORT || '4001', 10),
    },
  },
  rabbitmq: {
    url: process.env.RABBIT_URL || '',
  },
});
