import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { WebhookController } from './webhook.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from '../entities/payment.entity';
import { WebhookLog } from '../entities/webhook-log.entity';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { NOTIFICATION_SERVICE, ORDER_SERVICE } from '@/common/utils';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PaystackProvider } from './providers';
import { HttpModule } from '@nestjs/axios';
import { IdempotencyModule } from '@/idempotency/idempotency.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, WebhookLog]),
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
            queueOptions: { durable: true },
          },
        }),
        inject: [ConfigService],
      },
    ]),
    IdempotencyModule,
  ],
  providers: [PaymentService, PaystackProvider],
  controllers: [PaymentController, WebhookController],
})
export class PaymentModule {}
