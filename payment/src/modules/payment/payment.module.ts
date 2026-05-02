import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { WebhookController } from './webhook.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from '../entities/payment.entity';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { NOTIFICATION_SERVICE, ORDER_SERVICE } from '@/common/utils';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PayStackProvider } from './providers';
import { HttpModule } from '@nestjs/axios';
import { IdempotencyModule } from '@/idempotency/idempotency.module';
import { PaymentOutboxRelayService } from '@modules/payment/payment-outbox/payment-outbox.service';
import { PaymentOutbox } from '@modules/entities/payment.outbox.entity';
import { WebhookLog } from '@modules/entities/webhook-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, WebhookLog, PaymentOutbox]),
    HttpModule,
    ClientsModule.registerAsync([
      {
        name: ORDER_SERVICE,
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('services.order.host'),
            port: configService.get<number>('services.order.port'),
          },
        }),
        inject: [ConfigService],
      },
      {
        name: NOTIFICATION_SERVICE,
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [
              configService.get<string>('rabbitmq.url') ||
                'amqp://admin:admin@localhost:5672',
            ],
            queue: 'notification_queue',
            queueOptions: {
              durable: true,
              arguments: {
                'x-dead-letter-exchange': 'notification.dlx',
                'x-dead-letter-routing-key': 'notification.dlx',
              },
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
    IdempotencyModule,
  ],
  providers: [PaymentService, PayStackProvider, PaymentOutboxRelayService],
  controllers: [PaymentController, WebhookController],
})
export class PaymentModule {}
