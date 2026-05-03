import { Params } from 'nestjs-pino';
import { randomUUID } from 'crypto';
import { IncomingMessage } from 'http';
import { ServerResponse } from 'http';

export const loggerConfig = (serviceName: string): Params => ({
  pinoHttp: {
    name: serviceName,
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    autoLogging: true,
    timestamp:
      process.env.NODE_ENV !== 'production'
        ? () => `,"timestamp":"${new Date().toISOString()}"`
        : true,
    messageKey: 'message',
    genReqId: (req: IncomingMessage) =>
      (req.headers['x-correlation-id'] as string) || randomUUID(),
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
      paths: [
        'req.headers.authorization',
        'req.body.password',
        'req.body.idempotency',
        'req.body.cardNumber',
      ],
      censor: '****',
    },

    customProps: () => ({
      service: serviceName,
      environment: process.env.NODE_ENV,
    }),

    customLogLevel: (
      _req: IncomingMessage,
      res: ServerResponse,
      err?: Error,
    ) => {
      if (err || res.statusCode >= 500) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },

    customSuccessMessage: (req: IncomingMessage, res: ServerResponse) => {
      return `${req.method} ${req.url} ${res.statusCode}`;
    },

    customErrorMessage: (
      req: IncomingMessage,
      res: ServerResponse,
      err: Error,
    ) => {
      return `${req.method} ${req.url} ${res.statusCode} - ${err.message}`;
    },

    serializers: {
      req(req: IncomingMessage) {
        return {
          method: req.method,
          url: req.url,
          correlationId: req.headers['x-correlation-id'],
        };
      },
      res(res: ServerResponse) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  },
});
