import { sendToService } from '@/common/utils';
import { Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { HealthIndicatorResult } from '@nestjs/terminus';

@Injectable()
export class TcpHealthIndicator {
  async pingService(
    client: ClientProxy,
    name: string,
  ): Promise<HealthIndicatorResult> {
    try {
      await sendToService(client, { cmd: 'health' }, {}, { timeoutMs: 3000 });
      return {
        [name]: { status: 'up' },
      };
    } catch {
      return {
        [name]: { status: 'down', message: 'Service unreachable' },
      };
    }
  }
}
