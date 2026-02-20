import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';

export const USER_SERVICE = 'USER_SERVICE';
export const MENU_ITEM_SERVICE = 'MENU_ITEM_SERVICE';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: USER_SERVICE,
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => {
          const host = configService.get<string>('services.user.host');
          const port = configService.get<number>('services.user.port');
          console.log('USER_SERVICE connecting to:', { host, port });
          return {
            transport: Transport.TCP,
            options: { host, port },
          };
        },
        inject: [ConfigService],
      },
      {
        name: MENU_ITEM_SERVICE,
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('services.menuitem.host'),
            port: configService.get<number>('services.menuitem.port'),
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class AppClientsModule {}
