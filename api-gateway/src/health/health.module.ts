import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { AppClientsModule } from '@/modules/clients/client.module';
import { HealthController } from './health.controller';
import { TcpHealthIndicator } from './tcp-health-indicator';

@Module({
  imports: [TerminusModule, AppClientsModule],
  controllers: [HealthController],
  providers: [TcpHealthIndicator],
})
export class HealthModule {}
