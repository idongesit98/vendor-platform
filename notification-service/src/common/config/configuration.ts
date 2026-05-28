export default () => ({
  port: parseInt(process.env.PORT || '3004', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    host: process.env.NOTIF_DB_HOST,
    port: parseInt(process.env.DB_PORT || '5434', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '',
    name: process.env.NOTIF_DB_NAME || 'notif_db',
    url: process.env.NOTIF_DATABASE_URL,
  },
  rabbitmq: {
    url: process.env.RABBITMQ_URL || '',
  },
});
