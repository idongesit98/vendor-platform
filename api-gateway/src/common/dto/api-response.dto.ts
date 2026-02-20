import { ApiProperty } from '@nestjs/swagger';

/**
 * Base response for all the Api responses containing common fields
 * Used in the swagger documentation
 * it contains fields that are common across every response
 */
export class BaseApiResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Operation successful' })
  message: string;

  @ApiProperty({
    example: '8389192-3993-9293-1999-3939i3920030',
    required: false,
  })
  traceId?: string;
}

/**
 * Generic response DTO for internal type safety
 * Swagger handles the data property via decorators
 */

export class ApiResponseDto<T> extends BaseApiResponseDto {
  data: T;
}

export class ApiErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({ example: 'Validation failed' })
  message: string;

  @ApiProperty({ example: 'Bad request' })
  error: string;

  @ApiProperty({ example: 'Bad request' })
  traceId: string;

  @ApiProperty({ example: '2023-01-15T10:30:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/api/v1/auth/login' })
  path: string;
}
