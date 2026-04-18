import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Logger } from 'nestjs-pino';
import { setUpDeadLetterQueue } from './common/utils/rmq-helpers';

async function bootstrap() {
  await setUpDeadLetterQueue();
  const app = await NestFactory.create(AppModule);
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [
        process.env.RABBITMQ_URL ?? 'amqp://admin:admin@notify-rabbitmq:5672',
      ],
      queue: 'notification_queue',
      queueOptions: {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': 'notification.dlx',
          'x-dead-letter-routing-key': 'notification.dlx',
        },
      },
      noAck: false,
      prefetchCount: 10,
    },
  });

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port: 4003,
    },
  });

  app.useLogger(app.get(Logger));

  await app.startAllMicroservices();
  await app.listen(process.env.PORT ?? 3004);
  console.log(
    'Notification service is listening on TCP port 4003 while RabbitMQ is emitting on notification_queue',
  );
}
void bootstrap();
