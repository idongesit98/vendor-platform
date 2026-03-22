import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { TypeOrmHealthIndicator } from '@nestjs/terminus';

@Module({
  controllers: [HealthController, TypeOrmHealthIndicator],
})
export class HealthModule {}
