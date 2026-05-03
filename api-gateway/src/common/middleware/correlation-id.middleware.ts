import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { correlationStorage } from '../utils';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Extract traceId from incoming headers or generate a new one

    const correlationId =
      (req.headers['x-correlation-id'] as string) ?? uuidv4();

    // Attach to request for downstream use (interceptors, etc.)
    req.headers['x-correlation-id'] = correlationId;

    // Return in response headers for client-side tracking and auditing
    correlationStorage.run({ correlationId }, () => {
      next();
    });
  }
}
