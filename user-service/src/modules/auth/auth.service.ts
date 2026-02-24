import {
  CreateUserDto,
  CreateVendorDto,
  UpdateUserDto,
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
} from '@/common/utils';
import { handleErrors } from '@/common/utils/error-handler';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name, { timestamp: true });

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Vendor)
    private readonly vendorRepository: Repository<Vendor>,
    private readonly jwtService: JwtService,
  ) {}

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
      //const hashOtp = await hashPasswordAndOtp(otp);

      const user = this.userRepository.create({
        ...createUser,
        password: hashedPassword,
        role: Role.CUSTOMER,
        emailVerificationOtp: otp,
        otpExpiryTime: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      });

      const saved = await this.userRepository.save(user);
      this.logger.log(`User created successfully: ${saved.id}`);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...result } = saved;
      return {
        message:
          'User created successfully, Please verify your email using the OTP sent',
        User: result,
      };
    } catch (error) {
      return handleErrors(error, this.logger, 'Failed to create user');
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

      const vendor = this.vendorRepository.create({
        ...createVendor,
        password: hashedPassword,
        role: Role.VENDOR,
        emailVerificationOtp: otp,
        otpExpiryTime: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      });

      const saved = await this.vendorRepository.save(vendor);
      //Next step is to send the otp via notification service

      this.logger.log(`Vendor registered: ${saved.id}`);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...result } = saved;
      return {
        message: 'Vendor created successfully',
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

      if (
        account.emailVerificationOtp !== emailVerificationOtp ||
        account.otpExpiryTime < new Date()
      ) {
        throw new RpcException({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Invalid or expired OTP',
        });
      }

      account.isEmailVerified = true;

      await this.userRepository.save(account);
      return {
        message: 'OTP verified successful for user',
        Verified: account,
      };
    } catch (error) {
      return handleErrors(error, this.logger, 'Failed to verify email');
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

      if (
        account.emailVerificationOtp !== emailVerificationOtp ||
        account.otpExpiryTime < new Date()
      ) {
        throw new RpcException({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Invalid or expired OTP',
        });
      }

      account.isEmailVerified = true;

      await this.userRepository.save(account);
      return {
        message: 'OTP verified successful for vendor',
        Verified: account,
      };
    } catch (error) {
      return handleErrors(error, this.logger, 'Failed to verify email');
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
        roles: account.role,
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

      if (!payload?.sub || !payload.email || !payload.roles) {
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
      const user =
        (await this.userRepository.findOne({ where: { id: userId } })) ??
        (await this.vendorRepository.findOne({ where: { id: userId } }));

      if (!user) {
        throw new RpcException({
          status: HttpStatus.NOT_FOUND,
          message: 'User not found',
        });
      }

      return {
        statusCode: HttpStatus.NO_CONTENT,
        Deleted: user,
        message: 'User deleted successful',
      };
    } catch (error) {
      handleErrors(error, this.logger, 'Failed to delete user');
    }
  }
}
