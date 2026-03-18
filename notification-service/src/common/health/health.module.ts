import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TerminusModule, HttpModule, TypeOrmModule],
  controllers: [HealthController],
})
export class HealthModule {}
