import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: { host: '0.0.0.0', port: 4002 },
  });
  app.useLogger(app.get(Logger));

  await app.startAllMicroservices();
  console.log('✅ TCP Microservice listening on port 4002');
  await app.listen(process.env.PORT ?? 3003);
  console.log('Order service is running successfully on PORT 3003');
}
void bootstrap();
