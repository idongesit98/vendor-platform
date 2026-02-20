import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class HealthCheckResponseDto {
  @ApiProperty({
    enum: ['ok', 'error'],
    example: 'ok',
    description: 'Overall health status',
  })
  status: 'ok' | 'error';

  @ApiPropertyOptional({
    description: 'Details per check (e.g. redis)',
    example: { redis: { status: 'up' } },
  })
  info?: Record<string, { status: string }>;

  @ApiPropertyOptional({
    description: 'Error details when status is error',
  })
  error?: Record<string, unknown>;
}
