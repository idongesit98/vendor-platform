import { Controller, Get } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import {
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private db: TypeOrmHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([() => this.db.pingCheck('database')]);
  }

  @MessagePattern({ cmd: 'health' })
  healthCheck() {
    return { status: 'ok', service: 'user-service' };
  }
}
