import { ackMessage } from '@/common/utils';
import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload, RmqContext, Ctx } from '@nestjs/microservices';
import { ConsumeMessage } from 'amqplib';

@Controller()
export class DlqConsumer {
  private readonly logger = new Logger(DlqConsumer.name, { timestamp: true });

  @EventPattern('notification.dead')
  handleDeadLetter(@Payload() payload: unknown, @Ctx() context: RmqContext) {
    const message = context.getMessage() as ConsumeMessage;
    this.logger.error(
      `Dead-letter message received. ` +
        `Routing key: ${message.fields?.routingKey}. ` +
        `Death reason: ${JSON.stringify(message.properties?.headers?.['x-death'])}. ` +
        `Payload: ${JSON.stringify(payload)}`,
    );
    // TODO: Include feature to send to e.g Sentry or whatever industry standard
    ackMessage(context);
  }
}
