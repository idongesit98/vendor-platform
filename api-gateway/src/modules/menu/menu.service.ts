import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreateMenuDto } from './dto/create-menu.dto';
import { sendToService } from '@/common/utils';
import { MENU_ITEM_SERVICE } from '../clients/client.module';

@Injectable()
export class MenuService {
  constructor(
    @Inject(MENU_ITEM_SERVICE) private readonly client: ClientProxy,
  ) {}

  createMenu(createMenuDto: CreateMenuDto) {
    return sendToService(this.client, { cmd: 'menu.create' }, createMenuDto);
  }

  findById(id: string) {
    return sendToService(this.client, { cmd: 'menu.single-menu' }, { id });
  }

  getAll() {
    return sendToService(this.client, { cmd: 'menu.get-all' });
  }

  placeOrder() {
    return sendToService(this.client, { cmd: 'menu.order' });
  }

  withUser(id: string) {
    return sendToService(this.client, { cmd: 'menu.with-user' }, { id });
  }
}
