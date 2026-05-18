import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaymentOutbox } from '@modules/entities/payment.outbox.entity';
import { LessThan, Repository } from 'typeorm';
import { NOTIFICATION_SERVICE, ORDER_SERVICE } from '@common/utils';
import { ClientProxy } from '@nestjs/microservices';
import { Cron, CronExpression } from '@nestjs/schedule';

const MAX_ATTEMPTS = 5;
@Injectable()
export class PaymentOutboxRelayService {
  private readonly logger = new Logger(PaymentOutboxRelayService.name, {
    timestamp: true,
  });

  constructor(
    @InjectRepository(PaymentOutbox)
    private readonly outboxRepository: Repository<PaymentOutbox>,
    @Inject(NOTIFICATION_SERVICE)
    private readonly notificationClient: ClientProxy,
    @Inject(ORDER_SERVICE)
    private readonly orderClient: ClientProxy,
  ) {}

  onModuleInit() {
    const connect = (client: ClientProxy, name: string) =>
      client
        .connect()
        .then(() => {
          this.logger.log(`Connected to ${name}`);
        })
        .catch((err: unknown) => {
          this.logger.error(
            `${name} connection failed: ${JSON.stringify(err, Object.getOwnPropertyNames(err), 2)}`,
          );
        });
    void connect(this.notificationClient, 'RabbitMQ (notification)');
    void connect(this.orderClient, 'TCP (order)');
  }

  @Cron(CronExpression.EVERY_5_SECONDS)
  async relay() {
    const pending = await this.outboxRepository.find({
      where: {
        processed: false,
        attempts: LessThan(MAX_ATTEMPTS),
      },
      order: { createdAt: 'ASC' },
      take: 50,
    });

    for (const row of pending) {
      try {
        this.publish(row.eventType, row.payload);

        await this.outboxRepository.update(row.id, {
          processed: true,
          processedAt: new Date(),
          attempts: row.attempts + 1,
        });
        this.logger.log(`Outbox relay: published ${row.eventType} (${row.id})`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await this.outboxRepository.update(row.id, {
          attempts: row.attempts + 1,
          errorMessage: message,
        });
        this.logger.error(
          `Outbox relay failed for ${row.id} (attempt ${row.eventType} (${row.id}`,
        );
      }
    }
  }

  private publish(eventType: string, payload: Record<string, unknown>) {
    if (eventType.startsWith('order')) {
      this.orderClient.emit(eventType, payload);
    } else {
      this.notificationClient.emit(eventType, payload);
    }
  }
}
