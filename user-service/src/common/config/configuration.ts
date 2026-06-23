export default () => ({
  port: parseInt(process.env.USER_PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
  url: {
    front: process.env.FRONTEND_URL || 'http://localhost:3000/api/users/verify',
    database: process.env.USER_DATABASE_URL,
  },
  database: {
    host: process.env.USER_DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5434', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '',
    name: process.env.USER_DB_NAME || 'user_db',
  },
  redis: {
    url: process.env.REDIS_URL,
  },
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5672',
  },
});
