export default () => ({
  port: parseInt(process.env.ORDER_PORT || '3003', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    host: process.env.ORDER_DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5434', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '',
    name: process.env.ORDER_DB_NAME || 'order_db',
    url: process.env.ORDER_DATABASE_URL,
  },
  services: {
    menuitem: {
      host: process.env.MENU_SERVICE_HOST || 'localhost',
      port: parseInt(process.env.MENU_SERVICE_PORT || '4001', 10),
    },
  },
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5672',
  },
});
