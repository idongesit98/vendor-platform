import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from '../../common/dto';
import { RpcException } from '@nestjs/microservices';
import { User } from '@/common/entities';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name, { timestamp: true });

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existing = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existing) {
      throw new RpcException({
        statusCode: 409,
        message: `User with email ${createUserDto.email} already exists`,
      });
    }

    const user = this.userRepository.create(createUserDto);
    const saved = await this.userRepository.save(user);
    this.logger.log(`Create User: ${saved.id} (${saved.email})`);
    return saved;
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new RpcException({
        statusCode: 404,
        message: `User with id ${id} not found`,
      });
    }
    return user;
  }
}
