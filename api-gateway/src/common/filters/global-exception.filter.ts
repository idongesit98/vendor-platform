import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<{
      url: string;
      headers: Record<string, string>;
    }>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message =
        typeof res === 'string' ? res : (res as { message: string }).message;
    } else if (
      typeof exception === 'object' &&
      exception !== null &&
      'statusCode' in exception
    ) {
      const rpc = exception as { statusCode: number; message: string };
      status = rpc.statusCode;
      message = rpc.message;
    }

    const correlationId = request.headers['x-correlation-id'] ?? 'no-id';
    this.logger.error(
      `[${correlationId}] ${request.url} - [${status}] ${message}`,
    );
    response.status(status).json({
      statusCode: status,
      message,
      correlationId,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
