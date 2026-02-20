import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Extract traceId from incoming headers or generate a new one
    const traceId = (req.headers['x-trace-id'] as string) || uuidv4();

    // Attach to request for downstream use (interceptors, etc.)
    req['traceId'] = traceId;

    // Return in response headers for client-side tracking and auditing
    res.setHeader('X-Trace-Id', traceId);

    next();
  }
}
