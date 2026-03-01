import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  CreateUserDto,
  CreateVendorDto,
  LoginUserDto,
  VerifyEmailDto,
} from './dto';
import { ApiTags } from '@nestjs/swagger';
import { USER_SERVICE } from '../clients/client.module';
import { ClientProxy } from '@nestjs/microservices';
import { sendToService } from '@/common/utils';

@ApiTags('Auth')
@Controller('users')
export class UserController {
  //constructor(private readonly userService: UserService) {}
  constructor(@Inject(USER_SERVICE) private readonly client: ClientProxy) {}

  @Post('create-user')
  @HttpCode(HttpStatus.CREATED)
  createUser(@Body() createUserDto: CreateUserDto) {
    return sendToService(
      this.client,
      { cmd: 'auth.register-user' },
      createUserDto,
    );
  }

  @Post('create-vendor')
  @HttpCode(HttpStatus.CREATED)
  createVendor(@Body() createVendorDto: CreateVendorDto) {
    return sendToService(
      this.client,
      { cmd: 'auth.register-vendor' },
      createVendorDto,
    );
  }

  @Post('verify/user')
  @HttpCode(HttpStatus.OK)
  verifyUsersEmail(
    @Query() query: { email: string; emailVerificationOtp: string },
    @Body() verifyDto: VerifyEmailDto,
  ) {
    return sendToService(
      this.client,
      { cmd: 'auth.verify-user-email' },
      { ...verifyDto, ...query },
    );
  }

  @Post('verify/vendor')
  @HttpCode(HttpStatus.OK)
  verifyVendorsEmail(
    @Query() query: { email: string; emailVerificationOtp: string },
    @Body() verifyDto: VerifyEmailDto,
  ) {
    return sendToService(
      this.client,
      { cmd: 'auth.verify-vendor-email' },
      { ...verifyDto, ...query },
    );
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() loginDto: LoginUserDto) {
    return sendToService(this.client, { cmd: 'auth.login' }, loginDto);
  }

  @Get('all')
  @HttpCode(HttpStatus.OK)
  findAll() {
    return sendToService(this.client, { cmd: 'auth.all-users' });
  }

  @Get('vendors/all')
  @HttpCode(HttpStatus.OK)
  allVendors() {
    return sendToService(this.client, { cmd: 'auth.all-vendors' });
  }

  @Get('single/:id')
  @HttpCode(HttpStatus.OK)
  findById(@Param('id') userId: string) {
    return sendToService(this.client, { cmd: 'auth.single-user' }, { userId });
  }

  @Delete('delete/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteUser(@Param('id') userId: string) {
    return sendToService(this.client, { cmd: 'auth.delete-user' }, { userId });
  }

  tokenValidation(token: string) {
    return sendToService(
      this.client,
      { cmd: 'auth.validate-token' },
      { token },
    );
  }
}
