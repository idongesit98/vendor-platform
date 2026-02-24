import { Controller } from '@nestjs/common';
import { AuthService } from './auth.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  CreateUserDto,
  CreateVendorDto,
  LoginDto,
  UpdateUserDto,
  VerifyEmailDto,
} from '@/common/dto';
import { JwtPayload } from '@/common/interfaces';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern({ cmd: 'auth.register-user' })
  registerUser(@Payload() createDto: CreateUserDto) {
    return this.authService.createUser(createDto);
  }

  @MessagePattern({ cmd: 'auth.verify-user-email' })
  emailVerificationUsers(@Payload() data: VerifyEmailDto) {
    return this.authService.verifyUsersEmail(data);
  }

  @MessagePattern({ cmd: 'auth.verify-vendor-email' })
  emailVerificationVendord(@Payload() data: VerifyEmailDto) {
    return this.authService.verifyVendorsEmail(data);
  }

  @MessagePattern({ cmd: 'auth.all-users' })
  findAllUsers() {
    return this.authService.allUser();
  }

  @MessagePattern({ cmd: 'auth.register-vendor' })
  registerVendor(@Payload() createVendor: CreateVendorDto) {
    return this.authService.createVendor(createVendor);
  }

  @MessagePattern({ cmd: 'auth.login' })
  login(@Payload() loginDto: LoginDto) {
    return this.authService.loginUsers(loginDto);
  }

  @MessagePattern({ cmd: 'auth.validate-token' })
  validateToken(@Payload() payload: { token: string }): Promise<JwtPayload> {
    return this.authService.validateToken(payload.token);
  }

  @MessagePattern({ cmd: 'auth.update-user' })
  userUpdate(@Payload() data: { userId: string; updateUser: UpdateUserDto }) {
    return this.authService.updateUser(data.userId, data.updateUser);
  }

  @MessagePattern({ cmd: 'auth.single-user' })
  singleUser(@Payload() data: { id: string }) {
    return this.authService.findSingleUser(data.id);
  }

  @MessagePattern({ cmd: 'auth.delete-user' })
  userDeleted(@Payload() data: { userId: string }) {
    return this.authService.deleteUsers(data.userId);
  }
}
