import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json } from 'express';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  try {
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
    console.log('✅ Microservices started');

    await app.listen(3005, '0.0.0.0');
    console.log('✅ HTTP server started on port 3005');
  } catch (error) {
    console.error('❌ Bootstrap failed:', error);
    process.exit(1);
  }
}

void bootstrap();
