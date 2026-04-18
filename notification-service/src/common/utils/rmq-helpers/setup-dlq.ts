import * as amqplib from 'amqplib';

export async function setUpDeadLetterQueue(): Promise<void> {
  const connection = await amqplib.connect(process.env.RABBITMQ_URL!);
  const channel = await connection.createChannel();

  await channel.assertExchange('notification.dlx', 'direct', { durable: true });

  await channel.assertQueue('notification.dead_queue', { durable: true });

  await channel.bindQueue(
    'notification.dead_queue',
    'notification.dlx',
    'notification.dead',
  );

  await channel.close();
  await connection.close();
}
