import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { json, urlencoded } from 'express';
import { ValidationPipe } from '@nestjs/common';
import basicAuth from 'express-basic-auth';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  app.setGlobalPrefix('api', { exclude: ['health'] });

  app.use(helmet());
  app.use(json());
  app.use(urlencoded({ extended: true }));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const swaggerUser = process.env.SWAGGER_USER;
  const swaggerPassword = process.env.SWAGGER_PASSWORD;

  if (!swaggerUser || !swaggerPassword) {
    throw new Error(
      'Startup failed: SWAGGER_USER and SWAGGER_PASSWORD must be defined.',
    );
  }

  app.use(
    ['/api/docs', '/api/docs-json'],
    basicAuth({
      challenge: true,
      users: {
        [swaggerUser]: swaggerPassword,
      },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Food Delivery Service')
    .setDescription('API Gateway for the Food vendor API platform.')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Health', 'Health check endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get<number>('port') ?? 3000;
  await app.listen(port);

  console.log(
    `\n🚀 API Gateway is running on: http://localhost:${String(port)}`,
  );
  console.log(
    `📚 Swagger documentation: http://localhost:${String(port)}/api/docs\n`,
  );
}
void bootstrap();
