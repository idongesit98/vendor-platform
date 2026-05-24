import { Controller, Inject } from '@nestjs/common';
import { UserService } from './user.service';
import { ClientProxy, MessagePattern, Payload } from '@nestjs/microservices';
import { ReviewVendorDto } from '@common/dto/review-vendor.dto';
import { ToggleAccountDto } from '@common/dto/toggle-account.dto';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    @Inject('MENU_SERVICE') private readonly menuClient: ClientProxy,
  ) {}

  @MessagePattern({ cmd: 'admin-review.vendor' })
  reviewVendor(
    @Payload() data: { vendorId: string; reviewVendor: ReviewVendorDto },
  ) {
    return this.userService.reviewVendorApplication(
      data.vendorId,
      data.reviewVendor,
    );
  }

  @MessagePattern({ cmd: 'admin-toggle.user' })
  toggleUserAccountActiveness(
    @Payload() data: { userId: string; toggleDto: ToggleAccountDto },
  ) {
    return this.userService.toggleUserAccount(data.userId, data.toggleDto);
  }

  @MessagePattern({ cmd: 'admin-toggle.vendor' })
  toggleVendorAccountActiveness(
    @Payload() data: { vendorId: string; toggleDto: ToggleAccountDto },
  ) {
    return this.userService.toggleVendorAccount(data.vendorId, data.toggleDto);
  }

  //@Get(':id/menu-items')
  // @MessagePattern({ cmd: 'user.user-menu' })
  // async getMenuItemsForUser(@Param('id', ParseUUIDPipe) id: string) {
  //   // Optionally verify user exists first
  //   await this.userService.findOne(id);
  //
  //   // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  //   return firstValueFrom(
  //     this.menuClient.send({ cmd: 'menu.get-all' }, {}).pipe(
  //       timeout(5000),
  //       catchError(() => {
  //         throw new BadRequestException('Menu service unavailable');
  //       }),
  //     ),
  //   );
  // }

  @MessagePattern({ cmd: 'health' })
  healthCheck() {
    return { status: 'up', service: 'user-service' };
  }
}
