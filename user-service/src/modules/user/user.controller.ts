import {
  BadRequestException,
  Body,
  Controller,
  Inject,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from '../../common/dto/create-user.dto';
import { ClientProxy, MessagePattern, Payload } from '@nestjs/microservices';
import { catchError, firstValueFrom, timeout } from 'rxjs';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    @Inject('MENU_SERVICE') private readonly menuClient: ClientProxy,
  ) {}

  @MessagePattern({ cmd: 'user.create' })
  create(@Payload() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @MessagePattern({ cmd: 'user.findAll' })
  findAll() {
    return this.userService.findAll();
  }

  @MessagePattern({ cmd: 'user.findById' })
  findById(@Payload() payload: { id: string }) {
    return this.userService.findOne(payload.id);
  }

  //@Get(':id/menu-items')
  @MessagePattern({ cmd: 'user.user-menu' })
  async getMenuItemsForUser(@Param('id', ParseUUIDPipe) id: string) {
    // Optionally verify user exists first
    await this.userService.findOne(id);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return firstValueFrom(
      this.menuClient.send({ cmd: 'menu.get-all' }, {}).pipe(
        timeout(5000),
        catchError(() => {
          throw new BadRequestException('Menu service unavailable');
        }),
      ),
    );
  }

  @MessagePattern({ cmd: 'health' })
  healthCheck() {
    return { status: 'up', service: 'user-service' };
  }
}
