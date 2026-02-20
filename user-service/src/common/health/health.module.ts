import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TerminusModule, HttpModule, TypeOrmModule],
  controllers: [HealthController],
})
export class HealthModule {}
