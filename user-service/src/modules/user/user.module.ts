import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { User } from '@/common/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    ClientsModule.register([
      {
        name: 'MENU_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.MENU_SERVICE_HOST || 'localhost',
          port: parseInt(process.env.MENU_SERVICE_PORT!) || 4001,
        },
      },
    ]),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
