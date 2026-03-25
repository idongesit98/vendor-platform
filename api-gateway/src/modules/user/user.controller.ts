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
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ClientProxy } from '@nestjs/microservices';
import { sendToService, USER_SERVICE } from '@/common/utils';
import { ApiSuccessResponse } from '@/common/decorators/swagger/success-response.decorator';
import { SwaggerResponses } from '@/common/decorators/swagger';

@ApiTags('Auth')
@Controller('users')
export class UserController {
  //constructor(private readonly userService: UserService) {}
  constructor(@Inject(USER_SERVICE) private readonly client: ClientProxy) {}

  @Post('create-user')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a user' })
  @ApiSuccessResponse({
    status: 200,
    description: 'User created successfully',
    type: CreateUserDto,
  })
  @ApiResponse(SwaggerResponses.unauthorized)
  @ApiResponse(SwaggerResponses.notFound)
  @ApiResponse(SwaggerResponses.internalServerError)
  createUser(@Body() createUserDto: CreateUserDto) {
    return sendToService(
      this.client,
      { cmd: 'auth.register-user' },
      createUserDto,
    );
  }

  @Post('create-vendor')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an account for a vendor' })
  @ApiSuccessResponse({
    status: 200,
    description: 'Vendor account created successfully',
    type: CreateVendorDto,
  })
  @ApiResponse(SwaggerResponses.unauthorized)
  @ApiResponse(SwaggerResponses.notFound)
  @ApiResponse(SwaggerResponses.internalServerError)
  createVendor(@Body() createVendorDto: CreateVendorDto) {
    return sendToService(
      this.client,
      { cmd: 'auth.register-vendor' },
      createVendorDto,
    );
  }

  @Post('verify/user')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify an email for a user' })
  @ApiSuccessResponse({
    status: 200,
    description: 'Verify email created',
    type: VerifyEmailDto,
  })
  @ApiResponse(SwaggerResponses.unauthorized)
  @ApiResponse(SwaggerResponses.notFound)
  @ApiResponse(SwaggerResponses.internalServerError)
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
  @ApiOperation({ summary: 'Verify an email for a vendor' })
  @ApiSuccessResponse({
    status: 200,
    description: 'Verify email created',
    type: VerifyEmailDto,
  })
  @ApiResponse(SwaggerResponses.unauthorized)
  @ApiResponse(SwaggerResponses.notFound)
  @ApiResponse(SwaggerResponses.internalServerError)
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
  @ApiOperation({ summary: 'Login user' })
  @ApiSuccessResponse({
    status: 200,
    description: 'Login user',
    type: LoginUserDto,
  })
  @ApiResponse(SwaggerResponses.unauthorized)
  @ApiResponse(SwaggerResponses.notFound)
  @ApiResponse(SwaggerResponses.internalServerError)
  login(@Body() loginDto: LoginUserDto) {
    return sendToService(this.client, { cmd: 'auth.login' }, loginDto);
  }

  @Get('all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all users' })
  @ApiSuccessResponse({
    status: 200,
    description: 'Get all users created',
  })
  @ApiResponse(SwaggerResponses.unauthorized)
  @ApiResponse(SwaggerResponses.notFound)
  @ApiResponse(SwaggerResponses.internalServerError)
  findAll() {
    return sendToService(this.client, { cmd: 'auth.all-users' });
  }

  @Get('single/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a single user by ID' })
  @ApiSuccessResponse({
    status: 200,
    description: 'Find a single user',
  })
  @ApiResponse(SwaggerResponses.unauthorized)
  @ApiResponse(SwaggerResponses.notFound)
  @ApiResponse(SwaggerResponses.internalServerError)
  findById(@Param('id') userId: string) {
    return sendToService(this.client, { cmd: 'auth.single-user' }, { userId });
  }

  @Delete('delete/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a user' })
  @ApiSuccessResponse({
    status: 200,
    description: 'Delete a user',
  })
  @ApiResponse(SwaggerResponses.unauthorized)
  @ApiResponse(SwaggerResponses.notFound)
  @ApiResponse(SwaggerResponses.internalServerError)
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
