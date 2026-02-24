import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { tap } from 'rxjs';

interface RequestWithTrace extends Request {
  traceId?: string;
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('API-Gateway');

  intercept(context: ExecutionContext, next: CallHandler) {
    const http = context.switchToHttp();
    const request = http.getRequest<RequestWithTrace>();
    const response = http.getResponse<Response>();

    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        this.logger.log(
          `${request.method} ${request.originalUrl} ${response.statusCode} - ${duration}ms`,
        );
      }),
    );
  }
}
