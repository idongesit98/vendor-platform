import { Params } from 'nestjs-pino';

export const LoggerConfig = (serviceName: string): Params => ({
  pinoHttp: {
    name: serviceName,
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',

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

    redact: {
      paths: ['password', 'hashedPassword', 'cardNumber', 'idempotencyKey'],
      censor: '****',
    },

    customProps: () => ({
      service: serviceName,
      environment: process.env.NODE_ENV,
    }),
  },
});
