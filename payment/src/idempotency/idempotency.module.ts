import { Module } from '@nestjs/common';
import { IdempotencyService } from './idempotency.service';
import { RedisProvider } from '@/idempotency/redis.provider';

@Module({
  providers: [IdempotencyService, RedisProvider],
  exports: [IdempotencyService],
})
export class IdempotencyModule {}
