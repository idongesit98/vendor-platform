import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreateUserDto, LoginUserDto } from './dto';
import { sendToService } from '@/common/utils';
import { USER_SERVICE } from '../clients/client.module';

@Injectable()
export class UserService {
  constructor(@Inject(USER_SERVICE) private readonly client: ClientProxy) {}

  createUser(createUserDto: CreateUserDto) {
    return sendToService(this.client, { cmd: 'user.create' }, createUserDto);
  }

  findAll() {
    return sendToService(this.client, { cmd: 'user.findAll' });
  }

  getMenuItems() {
    return sendToService(this.client, { cmd: 'user.user-menu' });
  }

  findById(id: string) {
    return sendToService(this.client, { cmd: 'user.findById' }, { id });
  }

  login(loginDto: LoginUserDto) {
    return sendToService(this.client, { cmd: 'auth.login' }, loginDto);
  }
}
