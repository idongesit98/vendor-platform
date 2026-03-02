import { Module } from '@nestjs/common';
import { AppClientsModule } from '../clients/client.module';
import { MenuController } from './menu.controller';
import { CategoryController } from './category/category.controller';

@Module({
  imports: [AppClientsModule],
  controllers: [MenuController, CategoryController],
})
export class MenuModule {}
