import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApplicationStatus } from '@common/enums';

export class ReviewVendorDto {
  @IsEnum([ApplicationStatus.VERIFIED, ApplicationStatus.REJECTED])
  status: ApplicationStatus.VERIFIED | ApplicationStatus.REJECTED;

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
