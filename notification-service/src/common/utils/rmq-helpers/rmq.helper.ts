import { Logger } from '@nestjs/common';
import { RmqContext } from '@nestjs/microservices';
import { Channel, ConsumeMessage } from 'amqplib';

const logger = new Logger('RmqHelper');
const MAX_RETRIES = 3;
export function ackMessage(context: RmqContext): void {
  const channel = context.getChannelRef() as Channel;
  const message = context.getMessage() as ConsumeMessage;
  channel.ack(message);
}

export function nackMessage(context: RmqContext, requeue = false): void {
  const channel = context.getChannelRef() as Channel;
  const message = context.getMessage() as ConsumeMessage;
  channel.nack(message, false, requeue);
}

export function nackWithRetry(context: RmqContext): void {
  const channel = context.getChannelRef() as Channel;
  const message = context.getMessage() as ConsumeMessage;

  const retryCount =
    (message.properties.headers?.['x-retry-count'] as number) ?? 0;

  if (retryCount < MAX_RETRIES) {
    logger.warn(`Retrying message. Attempt ${retryCount + 1}/${MAX_RETRIES}`);
    channel.nack(message, false, true);
  } else {
    logger.error(
      `Message failed after ${MAX_RETRIES} retries. Sending to DLQ.`,
    );
    channel.nack(message, false, false);
  }
}
