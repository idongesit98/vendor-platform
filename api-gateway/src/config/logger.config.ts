import { Params } from 'nestjs-pino';
import { Request, Response } from 'express';
import { randomUUID } from 'crypto';

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
    genReqId: (req: Request) =>
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

    customLogLevel: (_req: Request, res: Response, err?: Error) => {
      if (err || res.statusCode >= 500) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },

    customSuccessMessage: (req: Request, res: Response) => {
      return `${req.method} ${req.url} ${res.statusCode}`;
    },

    customErrorMessage: (req: Request, res: Response, err: Error) => {
      return `${req.method} ${req.url} ${res.statusCode} - ${err.message}`;
    },

    serializers: {
      req(req: Request) {
        return {
          method: req.method,
          url: req.url,
          correlationId: req.headers['x-correlation-id'],
        };
      },
      res(res: Response) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  },
});
