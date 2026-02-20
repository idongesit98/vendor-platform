import { Module } from '@nestjs/common';
import { AppClientsModule } from '../clients/client.module';
import { UserService } from './user.service';
import { UserController } from './user.controller';

@Module({
  imports: [AppClientsModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
