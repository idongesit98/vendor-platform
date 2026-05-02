import { Params } from 'nestjs-pino';

export const LoggerConfig = (serviceName: string): Params => ({
  pinoHttp: {
    name: serviceName,
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',

    //pretty in dev, JSON in production
    transport:
      process.env.NODE_ENV !== 'production'
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'SYS:standard',
              ignore: 'pid,hostname',
              singleLine: false,
            },
          }
        : undefined,

    // ✅ mask sensitive fields
    redact: {
      paths: ['password', 'hashedPassword', 'cardNumber', 'idempotencyKey'],
      censor: '****',
    },

    // ✅ custom fields on every log entry
    customProps: () => ({
      service: serviceName,
      environment: process.env.NODE_ENV,
    }),
  },
});
