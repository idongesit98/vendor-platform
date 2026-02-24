import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from './common/config/configuration';
import { validationSchema } from './common/config/validation.schema';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthModule } from './common/health/health.module';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.name'),
        autoLoadEntities: true,
        synchronize: true,
        migrations: [__dirname + '/database/migrations/**/*{.ts,.js}'],
        migrationsRun: true,
        logging: true,
      }),
      inject: [ConfigService],
    }),
    HealthModule,
    UserModule,
    AuthModule,
  ],
})
export class AppModule {}
