import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'debug', 'fatal', 'log', 'warn'],
  });
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: { host: '0.0.0.0', port: 4000 }, // TCP microservice port
  });

  try {
    await app.startAllMicroservices();
    console.log('✅ TCP Microservice listening on port 4000');
  } catch (error) {
    console.error('❌ Microservice failed to start:', error);
  }
  await app.listen(process.env.PORT ?? 3001); // HTTP port — different!
  console.log(
    'Application started successfully, ✅ HTTP server running on port 3001',
  );
}
void bootstrap();
