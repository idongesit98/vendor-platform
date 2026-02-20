import { Module } from '@nestjs/common';
import { AppClientsModule } from '../clients/client.module';
import { MenuController } from './menu.controller';
import { MenuService } from './menu.service';

@Module({
  imports: [AppClientsModule],
  controllers: [MenuController],
  providers: [MenuService],
})
export class MenuModule {}
