import {
  CreateUserDto,
  CreateVendorDto,
  UpdateUserDto,
  UpdateVendor,
  VerifyEmailDto,
} from '@/common/dto';
import { LoginDto } from '@/common/dto/login-dto';
import { User, Vendor } from '@/common/entities';
import { Role } from '@/common/enums';
import {
  FindAllConfig,
  FindOneConfig,
  JwtPayload,
  OtpResendable,
  OtpVerifiableEntity,
  ResendOtpConfig,
  UpdateConfig,
  VerifyOtpConfig,
} from '@/common/interfaces';
import {
  comparePassword,
  generateOtp,
  hashPasswordAndOtp,
  NOTIFICATION_SERVICE,
} from '@/common/utils';
import { handleErrors } from '@/common/utils/error-handler';
import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { lastValueFrom } from 'rxjs';
import { ObjectLiteral, Repository } from 'typeorm';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name, { timestamp: true });
  constructor(
    @Inject(NOTIFICATION_SERVICE)
    private readonly notificationClient: ClientProxy,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Vendor)
    private readonly vendorRepository: Repository<Vendor>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    try {
      await this.notificationClient.connect();
      this.logger.log('Connected to RabbitMQ');
    } catch (err: unknown) {
      this.logger.error(
        `RabbitMQ connection failed: ${JSON.stringify(err, Object.getOwnPropertyNames(err), 2)}`,
      );
    }
  }

  async createUser(createUser: CreateUserDto) {
    const existing = await this.userRepository.findOne({
      where: { email: createUser.email },
    });

    if (existing) {
      throw new RpcException({
        statusCode: HttpStatus.CONFLICT,
        message: `Email ${createUser.email} is already registered`,
      });
    }
    try {
      const hashedPassword = await hashPasswordAndOtp(createUser.password);
      const otp = generateOtp();

      const link = `${this.configService.get<string>('url.front')}/user?email=${createUser.email}&emailVerificationOtp=${otp}`;
      const hashOtp = await hashPasswordAndOtp(otp);

      const user = this.userRepository.create({
        ...createUser,
        password: hashedPassword,
        role: Role.CUSTOMER,
        emailVerificationOtp: hashOtp,
        otpExpiryTime: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      });

      const saved = await this.userRepository.save(user);
      this.logger.log(`User created successfully: ${saved.id}`);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...result } = saved;

      await lastValueFrom(
        this.notificationClient.emit('user.created', {
          email: createUser.email,
          firstName: createUser.firstName,
          lastName: createUser.lastName,
          otp,
          verificationLink: link,
        }),
      );
      return {
        message:
          'User created successfully, Please verify your email using the OTP sent',
        User: result,
      };
    } catch (error) {
      handleErrors(error, this.logger, 'Failed to create user');
    }
  }

  async createVendor(createVendor: CreateVendorDto) {
    const existing = await this.vendorRepository.findOne({
      where: { email: createVendor.email },
    });

    if (existing) {
      throw new RpcException({
        statusCode: HttpStatus.CONFLICT,
        message: `Email ${createVendor.email} is already registered`,
      });
    }
    try {
      const hashedPassword = await hashPasswordAndOtp(createVendor.password);
      const otp = generateOtp();
      const link = `${this.configService.get<string>('url.front')}/vendor?email=${createVendor.email}&emailVerificationOtp=${otp}`;

      const hashOtp = await hashPasswordAndOtp(otp);

      const vendor = this.vendorRepository.create({
        ...createVendor,
        password: hashedPassword,
        role: Role.VENDOR,
        emailVerificationOtp: hashOtp,
        otpExpiryTime: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      });

      const saved = await this.vendorRepository.save(vendor);

      this.logger.log(`Vendor registered: ${saved.id}`);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...result } = saved;

      //Send notifications to new vendor created
      await lastValueFrom(
        this.notificationClient.emit('vendor.created', {
          businessName: createVendor.businessName,
          email: createVendor.email,
          address: createVendor.address,
          otp,
          verificationLink: link,
        }),
      );
      return {
        message:
          'Vendor created successfully, Please verify your email using the OTP sent',
        Vendor: result,
      };
    } catch (error) {
      return handleErrors(error, this.logger, 'Failed to create vendor');
    }
  }

  async verifyUsersEmail(data: VerifyEmailDto) {
    return this.verifyEmail({
      data,
      repository: this.userRepository,
      accountType: 'vendor',
    });
  }

  async verifyVendorsEmail(data: VerifyEmailDto) {
    return this.verifyEmail({
      data,
      repository: this.userRepository,
      accountType: 'user',
    });
  }

  async loginUsers(loginDto: LoginDto) {
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
    });

    const vendor = !user
      ? await this.vendorRepository.findOne({
          where: { email: loginDto.email },
        })
      : null;

    const account = user ?? vendor;

    if (!account) {
      throw new RpcException({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Invalid credentials',
      });
    }

    if (!account.isEmailVerified) {
      throw new RpcException({
        statusCode: HttpStatus.FORBIDDEN,
        message: 'Please verify your email before logging in',
      });
    }

    const isPasswordValid = await comparePassword(
      loginDto.password,
      account.password,
    );

    if (!isPasswordValid) {
      throw new RpcException({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Invalid credentials',
      });
    }
    try {
      const payload: JwtPayload = {
        sub: account.id,
        email: account.email,
        role: account.role,
      };

      const token = await this.jwtService.signAsync(payload);
      this.logger.log(`Login successful: ${account.id} (${account.role})`);

      return {
        message: 'User logged in successfully',
        accessToken: token,
        role: account.role,
        id: account.id,
      };
    } catch (error) {
      return handleErrors(error, this.logger, 'Failed to login user');
    }
  }

  async validateToken(token: string): Promise<JwtPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);

      if (!payload?.sub || !payload.email || !payload.role) {
        throw new RpcException({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Invalid token payload',
        });
      }
      return payload;
    } catch {
      throw new RpcException({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Invalid or expired token',
      });
    }
  }

  async resendUserOtp(email: string) {
    return this.resendOtp(email, {
      role: 'user',
      repository: this.userRepository,
      notFoundMessage: 'User account not found',
      urlPath: 'user',
      buildNotificationPayload: (user, otp, link) => ({
        role: 'user',
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        otp,
        verificationLink: link,
      }),
    });
  }

  async resendVendorOtp(email: string) {
    return this.resendOtp(email, {
      role: 'vendor',
      repository: this.vendorRepository,
      notFoundMessage: 'Vendor account not found',
      urlPath: 'vendor',
      buildNotificationPayload: (vendor, otp, link) => ({
        role: 'vendor',
        businessName: vendor.businessName,
        address: vendor.address,
        phone: vendor.phone,
        email: vendor.email,
        otp,
        verificationLink: link,
      }),
    });
  }

  async allUser() {
    return this.findAll({
      repository: this.userRepository,
      accountType: 'user',
    });
  }

  async allVendors() {
    return this.findAll({
      repository: this.vendorRepository,
      accountType: 'vendor',
    });
  }

  async updateUser(userId: string, updateUserDto: UpdateUserDto) {
    return this.update({
      id: userId,
      repository: this.userRepository,
      updateDto: updateUserDto,
      accountType: 'user',
    });
  }

  async updateVendor(vendorId: string, updateVendorDto: UpdateVendor) {
    return this.update({
      id: vendorId,
      repository: this.vendorRepository,
      updateDto: updateVendorDto,
      accountType: 'vendor',
    });
  }

  async findSingleUser(userId: string) {
    return this.findOne({
      id: userId,
      repository: this.userRepository,
      accountType: 'user',
    });
  }

  async findSingleVendor(vendorId: string) {
    return this.findOne({
      id: vendorId,
      repository: this.vendorRepository,
      accountType: 'vendor',
    });
  }

  async deleteUsers(userId: string) {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });

      if (user) {
        await this.userRepository.delete(userId);
        return {
          message: 'User deleted successfully',
          Deleted: user,
        };
      }

      const vendor = await this.vendorRepository.findOne({
        where: { id: userId },
      });

      if (vendor) {
        await this.vendorRepository.delete(userId);

        return {
          message: 'User deleted successfully',
          Deleted: vendor,
        };
      }

      if (!user || !vendor) {
        throw new RpcException({
          status: HttpStatus.NOT_FOUND,
          message: 'Users not found',
        });
      }
    } catch (error) {
      handleErrors(error, this.logger, 'Failed to delete user');
    }
  }

  private async resendOtp<T extends OtpResendable>(
    email: string,
    config: ResendOtpConfig<T>,
  ) {
    try {
      const entity = await config.repository.findOne({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        where: { email } as any,
      });
      this.logger.log(`Resend OTP requested for ${email}`);

      if (!entity) {
        throw new RpcException({
          statusCode: HttpStatus.NOT_FOUND,
          message: config.notFoundMessage,
        });
      }

      if (entity.isEmailVerified) {
        throw new RpcException({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Email is already verified',
        });
      }

      const now = new Date();
      const otpIsExpired = !entity.otpExpiryTime || entity.otpExpiryTime < now;

      if (!otpIsExpired) {
        const otpGeneratedAt =
          new Date(entity.otpExpiryTime!).getTime() - 10 * 60 * 1000;

        const secondsSinceOtpSent = (now.getTime() - otpGeneratedAt) / 1000;

        if (secondsSinceOtpSent < 60) {
          throw new RpcException({
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message:
              'Otp was recently sent. please wait before requesting a new one.',
          });
        }
      }

      const otp = generateOtp();
      this.logger.log(`Generated OTP for ${email}: ${otp}`);
      const link = `${this.configService.get<string>('url.front')}/${config.urlPath}?email=${email}&emailVerifiedOtp=${otp}`;
      const hashOtp = await hashPasswordAndOtp(otp);

      entity.emailVerificationOtp = hashOtp;
      entity.otpExpiryTime = new Date(Date.now() + 10 * 60 * 1000);
      await config.repository.save(entity);

      await lastValueFrom(
        this.notificationClient.emit(
          'otp.resend',
          config.buildNotificationPayload(entity, otp, link),
        ),
      );

      return {
        message: 'OTP resent successfully, please check your email for the OTP',
      };
    } catch (error) {
      handleErrors(error, this.logger, 'Failed to resend OTP');
    }
  }

  private async verifyEmail<T extends OtpVerifiableEntity>(
    config: VerifyOtpConfig<T>,
  ) {
    const { data, repository, accountType } = config;
    const { email, emailVerificationOtp } = data;
    try {
      const account = await config.repository.findOne({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        where: { email } as any,
      });

      if (!account) {
        throw new RpcException({
          statusCode: HttpStatus.NOT_FOUND,
          message: `${accountType} account not found`,
        });
      }

      if (account.isEmailVerified) {
        return { message: `${accountType} email already verified` };
      }

      if (account.otpExpiryTime! < new Date()) {
        throw new RpcException({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Invalid or expired OTP',
        });
      }

      const isOtpValid = await comparePassword(
        emailVerificationOtp,
        account.emailVerificationOtp,
      );

      if (!isOtpValid) {
        throw new RpcException({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Invalid or expired OTP',
        });
      }

      account.isEmailVerified = true;
      account.otpStatusSent = true;
      account.emailVerificationOtp = '';
      account.otpExpiryTime = new Date(0);

      await repository.save(account);

      return {
        message: `OTP verified successful for ${accountType}`,
        Verified: account,
      };
    } catch (error) {
      handleErrors(error, this.logger, 'Failed to verify email');
    }
  }

  private async findAll<T extends ObjectLiteral>({
    repository,
    accountType,
  }: FindAllConfig<T>) {
    try {
      const results = await repository.find({});

      if (!results.length) {
        throw new RpcException({
          statusCode: HttpStatus.NOT_FOUND,
          message: `No ${accountType} exists`,
        });
      }

      return {
        message: `${accountType}s retrieved successfully`,
        data: results,
      };
    } catch (error) {
      handleErrors(error, this.logger, `Failed to get all ${accountType}s`);
    }
  }

  private async findOne<T extends ObjectLiteral>({
    id,
    repository,
    accountType,
  }: FindOneConfig<T>) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const account = await repository.findOne({ where: { id } as any });

      if (!account) {
        throw new RpcException({
          statusCode: HttpStatus.NOT_FOUND,
          message: `${accountType} not found`,
        });
      }

      return {
        message: `${accountType} retrieved successfully`,
        data: account,
      };
    } catch (error) {
      handleErrors(error, this.logger, `Failed to find ${accountType}`);
    }
  }

  private async update<T extends ObjectLiteral, D extends ObjectLiteral>({
    id,
    repository,
    updateDto,
    accountType,
  }: UpdateConfig<T, D>) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const existing = await repository.findOne({ where: { id } as any });

      if (!existing) {
        throw new RpcException({
          statusCode: HttpStatus.NOT_FOUND,
          message: `${accountType} not found`,
        });
      }

      const updated = await repository.update({ id } as any, updateDto as any);

      return {
        message: `${accountType} updated successfully`,
        data: updated,
      };
    } catch (error) {
      handleErrors(error, this.logger, `Failed to update ${accountType}`);
    }
  }
}
