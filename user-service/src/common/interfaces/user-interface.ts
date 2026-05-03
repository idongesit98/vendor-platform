import { ObjectLiteral, Repository } from 'typeorm';
import { VerifyEmailDto } from '../dto';

export interface OtpResendable {
  email: string;
  isEmailVerified: boolean;
  otpExpiryTime: Date | null;
  emailVerificationOtp: string;
  firstName?: string;
  lastName?: string;
  businessName?: string;
  address?: string;
  phone?: string;
}

export interface OtpVerifiableEntity {
  email: string;
  isEmailVerified: boolean;
  otpExpiryTime: Date | null;
  emailVerificationOtp: string;
  otpStatusSent: boolean;
}

export interface ResendOtpConfig<T extends OtpResendable> {
  role: 'user' | 'vendor';
  repository: Repository<T>;
  notFoundMessage: string;
  urlPath: string;
  buildNotificationPayload: (entity: T, otp: string, link: string) => object;
}

export interface VerifyOtpConfig<T extends OtpVerifiableEntity> {
  data: VerifyEmailDto;
  repository: Repository<T>;
  accountType: 'user' | 'vendor';
}

export interface FindAllConfig<T extends ObjectLiteral> {
  repository: Repository<T>;
  accountType: 'user' | 'vendor';
}

export interface FindOneConfig<T extends ObjectLiteral> {
  id: string;
  repository: Repository<T>;
  accountType: 'user' | 'vendor';
}

export interface UpdateConfig<
  T extends ObjectLiteral,
  D extends ObjectLiteral,
> {
  id: string;
  repository: Repository<T>;
  updateDto: D;
  accountType: 'user' | 'vendor';
}
