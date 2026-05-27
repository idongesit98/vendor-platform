import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, Vendor } from '@/common/entities';
import { ToggleAccountDto } from '@common/dto/toggle-account.dto';
import { ReviewVendorDto } from '@common/dto/review-vendor.dto';
import { ApplicationStatus } from '@common/enums';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name, { timestamp: true });

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Vendor)
    private readonly vendorRepository: Repository<Vendor>,
  ) {}

  async toggleVendorAccount(vendorId: string, dto: ToggleAccountDto) {
    return this.toggleAccount(
      this.vendorRepository,
      vendorId,
      dto.isActive,
      'Vendor',
    );
  }

  async toggleUserAccount(userId: string, dto: ToggleAccountDto) {
    return this.toggleAccount(
      this.userRepository,
      userId,
      dto.isActive,
      'User',
    );
  }

  async reviewVendorApplication(vendorId: string, dto: ReviewVendorDto) {
    const vendor = await this.vendorRepository.findOne({
      where: { id: vendorId },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    if (vendor.applicationStatus !== ApplicationStatus.PENDING) {
      throw new BadRequestException(
        `Vendor application has already been ${vendor.applicationStatus}`,
      );
    }

    if (dto.status === ApplicationStatus.REJECTED && !dto.rejectionReason) {
      throw new BadRequestException(
        'A rejection reason is required when rejecting a vendor',
      );
    }

    vendor.applicationStatus = dto.status;
    vendor.rejectionReason =
      dto.status === ApplicationStatus.REJECTED
        ? (dto.rejectionReason ?? null)
        : null;

    await this.vendorRepository.save(vendor);

    return {
      message: `Vendor application has been ${dto.status}`,
      vendor: {
        id: vendor.id,
        businessName: vendor.businessName,
        email: vendor.email,
        applicationStatus: vendor.applicationStatus,
        rejectionReason: vendor.rejectionReason,
      },
    };
  }
  private async toggleAccount<T extends { id: string; isActive: boolean }>(
    repository: Repository<T>,
    id: string,
    isActive: boolean,
    entityName: string,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const entity = await repository.findOne({ where: { id } as any });

    if (!entity) {
      throw new NotFoundException(`${entityName} not found`);
    }

    if (entity.isActive === isActive) {
      throw new BadRequestException(
        `${entityName} account is already ${isActive ? 'active' : 'suspended'}`,
      );
    }

    entity.isActive = isActive;
    await repository.save(entity);

    return {
      message: `${entityName} account has been ${isActive ? 'activated' : 'suspended'}`,
      id: entity.id,
      isActive: entity.isActive,
    };
  }
}
