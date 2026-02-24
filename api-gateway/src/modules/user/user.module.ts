import { Module } from '@nestjs/common';
import { AppClientsModule } from '../clients/client.module';
import { UserController } from './user.controller';

@Module({
  imports: [AppClientsModule],
  controllers: [UserController],
})
export class UserModule {}
