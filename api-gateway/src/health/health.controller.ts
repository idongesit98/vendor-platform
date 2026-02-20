import { Controller, Get, Inject } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { TcpHealthIndicator } from './tcp-health-indicator';
import {
  MENU_ITEM_SERVICE,
  USER_SERVICE,
} from '@/modules/clients/client.module';
import { ClientProxy } from '@nestjs/microservices';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly tcpHealth: TcpHealthIndicator,
    @Inject(USER_SERVICE) private readonly userClient: ClientProxy,
    @Inject(MENU_ITEM_SERVICE) private readonly menuItemClient: ClientProxy,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.tcpHealth.pingService(this.userClient, 'user-service'),
      () =>
        this.tcpHealth.pingService(this.menuItemClient, 'menu-item-service'),
    ]);
  }
}
