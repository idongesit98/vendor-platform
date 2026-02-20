import { ApiErrorResponseDto } from '@/common/dto';
import { HttpStatus } from '@nestjs/common';
import { ApiResponseOptions } from '@nestjs/swagger';

export const SwaggerResponses: Record<string, ApiResponseOptions> = {
  unauthorized: {
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    type: ApiErrorResponseDto,
  },

  badRequest: {
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error',
    type: ApiErrorResponseDto,
  },

  tooManyRequests: {
    status: HttpStatus.TOO_MANY_REQUESTS,
    description: 'Too many requests',
    type: ApiErrorResponseDto,
  },

  notFound: {
    status: HttpStatus.NOT_FOUND,
    description: 'Not found',
    type: ApiErrorResponseDto,
  },
  forbidden: {
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden',
    type: ApiErrorResponseDto,
  },
  internalServerError: {
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
    type: ApiErrorResponseDto,
  },
};
