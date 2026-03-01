import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: { host: '0.0.0.0', port: 4001 },
  });
  app.useLogger(app.get(Logger));

  await app.startAllMicroservices();
  console.log('✅ TCP Microservice listening on port 4001');

  await app.listen(process.env.PORT ?? 3002);
  console.log('Menu is running successfully on PORT 3002');
}
void bootstrap();
