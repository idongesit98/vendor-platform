import { RpcException } from '@nestjs/microservices';
import { HttpStatus, Logger } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

export function handleErrors(
  error: unknown,
  logger?: Logger,
  fallbackMessage = 'Internal service error',
) {
  logger?.error(fallbackMessage, error as Error);

  if (error instanceof RpcException) {
    throw error;
  }

  if (error instanceof QueryFailedError) {
    if ((error as QueryFailedError & { code: string }).code === '23505') {
      throw new RpcException({
        statusCode: HttpStatus.CONFLICT,
        message: 'Resource already exists',
      });
    }
  }

  throw new RpcException({
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    message: fallbackMessage,
  });
}
