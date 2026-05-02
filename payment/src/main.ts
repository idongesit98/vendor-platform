import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json } from 'express';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(
    json({
      verify(req: any, _res, buf) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        req.rawBody = buf;
      },
    }),
  );
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: { host: '0.0.0.0', port: 4004 },
  });
  await app.startAllMicroservices();
  await app.listen(process.env.PORT ?? 3005);

  console.log('Payment Service TCP running on PORT 40O4');
  console.log('Payment Service Http running on PORT 3005');
  console.log('Webhook endpoint: POST http://localhost:3005/webhook/paystack');
}
void bootstrap();
