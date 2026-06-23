export default () => ({
  port: parseInt(process.env.PORT || '3002', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    host: process.env.MENU_DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5434', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '',
    name: process.env.MENU_DB_NAME || 'menu_db',
    url: process.env.MENU_DATABASE_URL,
  },
  redis: {
    url: process.env.REDIS_URL,
  },
});
