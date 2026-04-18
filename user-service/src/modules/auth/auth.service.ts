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
import { JwtPayload } from '@/common/interfaces';
import {
  comparePassword,
  generateOtp,
  hashPasswordAndOtp,
  NOTIFICATION_SERVICE,
} from '@/common/utils';
import { handleErrors } from '@/common/utils/error-handler';
import { MailService } from '@/service/mail/mail.service';
import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

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
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    try {
      await this.notificationClient.connect();
      this.logger.log('Connected to RabbitMQ');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `RabbitMQ connection failed: ${JSON.stringify(errorMessage)}`,
      );
    }
  }

  async createUser(createUser: CreateUserDto) {
    try {
      const existing = await this.userRepository.findOne({
        where: { email: createUser.email },
      });

      if (existing) {
        throw new RpcException({
          statusCode: HttpStatus.CONFLICT,
          message: `Email ${createUser.email} is already registered`,
        });
      }

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

      this.notificationClient.emit('user.created', {
        email: createUser.email,
        firstName: createUser.firstName,
        lastName: createUser.lastName,
        otp,
        verificationLink: link,
      });
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
    try {
      const existing = await this.vendorRepository.findOne({
        where: { email: createVendor.email },
      });

      if (existing) {
        throw new RpcException({
          statusCode: HttpStatus.CONFLICT,
          message: `Email ${createVendor.email} is already registered`,
        });
      }

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
      this.notificationClient.emit('vendor.created', {
        businessName: createVendor.businessName,
        email: createVendor.email,
        address: createVendor.address,
        otp,
        verificationLink: link,
      });
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
    try {
      const { email, emailVerificationOtp } = data;

      const account = await this.userRepository.findOne({ where: { email } });

      if (!account) {
        throw new RpcException({
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Account not found',
        });
      }

      if (account.isEmailVerified) {
        return { message: 'Email already verified' };
      }

      if (account.otpExpiryTime < new Date()) {
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

      await this.userRepository.save(account);
      return {
        message: 'OTP verified successful for user',
        Verified: account,
      };
    } catch (error) {
      handleErrors(error, this.logger, 'Failed to verify email');
    }
  }

  async verifyVendorsEmail(data: VerifyEmailDto) {
    try {
      const { email, emailVerificationOtp } = data;

      const account = await this.vendorRepository.findOne({ where: { email } });

      if (!account) {
        throw new RpcException({
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Vendor account not found',
        });
      }

      if (account.isEmailVerified) {
        return { message: 'Vendor email already verified' };
      }

      if (account.otpExpiryTime < new Date()) {
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

      await this.vendorRepository.save(account);
      return {
        message: 'OTP verified successful for vendor',
        Verified: account,
      };
    } catch (error) {
      handleErrors(error, this.logger, 'Failed to verify email');
    }
  }

  async loginUsers(loginDto: LoginDto) {
    try {
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
    try {
      const user = await this.userRepository.findOne({ where: { email } });
      this.logger.log(`Resend OTP requested for ${email}`);

      if (!user) {
        throw new RpcException({
          statusCode: HttpStatus.NOT_FOUND,
          message: 'User account not found',
        });
      }

      if (user.isEmailVerified) {
        throw new RpcException({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Email is already verified',
        });
      }

      const now = new Date();
      const otpIsExpired = !user.otpExpiryTime || user.otpExpiryTime < now;

      if (!otpIsExpired) {
        const otpGeneratedAt =
          new Date(user.otpExpiryTime).getTime() - 10 * 60 * 1000;
        const secondsSinceOtpSent = (now.getTime() - otpGeneratedAt) / 1000;

        if (secondsSinceOtpSent < 60) {
          throw new RpcException({
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message:
              'OTP was recently sent. Please wait before requesting a new one. ',
          });
        }
      }

      const otp = generateOtp();
      this.logger.log(`Generated OTP for ${email}: ${otp}`);
      const link = `${this.configService.get<string>('url.front')}/user?email=${email}&emailVerificationOtp=${otp}`;
      const hashOtp = await hashPasswordAndOtp(otp);

      user.emailVerificationOtp = hashOtp;
      user.otpExpiryTime = new Date(Date.now() + 10 * 60 * 1000);

      await this.userRepository.save(user);

      this.notificationClient.emit('otp.resend', {
        role: 'user',
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        otp,
        verificationLink: link,
      });

      return {
        message:
          'OTP resent successfully, please check your email for the new OTP',
      };
    } catch (error) {
      handleErrors(error, this.logger, 'Failed to resend OTP');
    }
  }

  async resendVendorOtp(email: string) {
    try {
      const vendor = await this.vendorRepository.findOne({ where: { email } });

      if (!vendor) {
        throw new RpcException({
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Vendor account not found',
        });
      }

      if (vendor.isEmailVerified) {
        throw new RpcException({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Email is already verified',
        });
      }

      if (
        vendor.otpExpiryTime &&
        new Date(vendor.otpExpiryTime).getTime() > Date.now() - 60 * 1000
      ) {
        throw new RpcException({
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message:
            'OTP was recently sent. Please wait before requesting a new one.',
        });
      }

      const otp = generateOtp();
      const link = `${this.configService.get<string>('url.front')}/vendor?email=${email}&emailVerificationOtp=${otp}`;
      const hashOtp = await hashPasswordAndOtp(otp);

      vendor.emailVerificationOtp = hashOtp;
      vendor.otpExpiryTime = new Date(Date.now() + 10 * 60 * 1000);

      await this.vendorRepository.save(vendor);

      this.notificationClient.emit('otp.resend', {
        role: 'vendor',
        businessName: vendor.businessName,
        address: vendor.address,
        phone: vendor.phone,
        email: vendor.email,
        otp,
        verificationLink: link,
      });

      return {
        message:
          'OTP resent successfully, please check your email for the new OTP',
      };
    } catch (error) {
      handleErrors(error, this.logger, 'Failed to resend OTP');
    }
  }

  async allUser() {
    try {
      const allUsers = await this.userRepository.find({});

      if (!allUsers) {
        throw new RpcException({
          statusCode: HttpStatus.NOT_FOUND,
          message: 'No user exists',
        });
      }

      return {
        message: 'Users retrieved successfully',
        AllUsers: allUsers,
      };
    } catch (error) {
      handleErrors(error, this.logger, 'Failed to get all users');
    }
  }

  async allVendors() {
    try {
      const allVendors = await this.vendorRepository.find({});

      if (!allVendors) {
        throw new RpcException({
          statusCode: HttpStatus.NOT_FOUND,
          message: 'No vendor exists',
        });
      }

      return {
        message: 'Vendors retrieved successfully',
        AllVendors: allVendors,
      };
    } catch (error) {
      handleErrors(error, this.logger, 'Failed to get all users');
    }
  }

  async updateUser(userId: string, updateUserDto: UpdateUserDto) {
    try {
      const existingUser = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!existingUser) {
        throw new RpcException({
          status: HttpStatus.NOT_FOUND,
          message: 'User not found',
        });
      }

      const updateUser = await this.userRepository.update(
        { id: userId },
        updateUserDto,
      );

      return {
        message: 'User updated successfully',
        Updated: updateUser,
      };
    } catch (error) {
      return handleErrors(error, this.logger, 'Failed to update user');
    }
  }

  async updateVendor(vendorId: string, updateVendorDto: UpdateVendor) {
    try {
      const existingVendor = await this.vendorRepository.findOne({
        where: { id: vendorId },
      });

      if (!existingVendor) {
        throw new RpcException({
          status: HttpStatus.NOT_FOUND,
          message: 'Vendor not found',
        });
      }

      const updateVendor = await this.vendorRepository.update(
        { id: vendorId },
        updateVendorDto,
      );

      return {
        message: 'Vendor updated successfully',
        Updated: updateVendor,
      };
    } catch (error) {
      return handleErrors(error, this.logger, 'Failed to update vendor');
    }
  }

  async findSingleUser(userId: string) {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });
      console.log('Is the user seen:', user);

      if (!user) {
        throw new RpcException({
          status: HttpStatus.NOT_FOUND,
          message: 'User not found',
        });
      }

      return {
        message: 'User retrieved successfully',
        User: user,
      };
    } catch (error) {
      return handleErrors(error, this.logger, 'Failed to find user');
    }
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
}
