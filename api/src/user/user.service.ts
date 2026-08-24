import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import * as argon2 from 'argon2';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { FindUserDto } from './dto/find-user.dto';
import { PaginationMetaDto } from '../shared/dto/pagination-meta.dto';
import { PaginatedResponseDto } from '../shared/dto/paginated-response.dto';
import { UserSearchAdminDto } from './dto/user-search-admin.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly eventEmitter: EventEmitter2,
  ) { }

  async findAll(
    searchDto: UserSearchAdminDto,
  ): Promise<PaginatedResponseDto<User>> {
    const {
      page = 1,
      limit = 10,
      search,
      role,
      isBanned,
      isVerified,
    } = searchDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.userRepository.createQueryBuilder('user');

    if (role) {
      queryBuilder.andWhere('user.role = :role', { role });
    }

    if (isBanned !== undefined) {
      queryBuilder.andWhere('user.isBanned = :isBanned', { isBanned });
    }

    if (isVerified !== undefined) {
      queryBuilder.andWhere('user.isVerified = :isVerified', { isVerified });
    }

    if (search) {
      queryBuilder.andWhere(
        '(user.username ILIKE :search OR user.email ILIKE :search OR user.displayname ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    queryBuilder.skip(skip).take(limit);

    const [data, totalCount] = await queryBuilder.getManyAndCount();

    return new PaginatedResponseDto(
      data,
      new PaginationMetaDto(totalCount, page, limit, data.length),
    );
  }

  async findOne(dto: FindUserDto): Promise<User> {
    const user = await this.userRepository.findOneBy(dto);
    return user;
  }

  async findUserRestrictions(
    userId: string,
  ): Promise<{ allergies: string[]; dietary: string[] }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['allergies', 'dietary'],
    });

    if (!user) throw new NotFoundException(`User with this ID not found`);

    return {
      allergies: user.allergies ?? [],
      dietary: user.dietary ?? [],
    };
  }

  async create(dto: CreateUserDto): Promise<User> {
    const { password, ...rest } = dto;
    const passwordHash = await argon2.hash(password);
    const newUser = this.userRepository.create({
      ...rest,
      passwordHash,
    });
    const saved = await this.userRepository.save(newUser);
    this.logger.log(
      `[User] Created new user: ${saved.email} (ID: ${saved.id})`,
    );
    return saved;
  }

  async update(id: string, dto: DeepPartial<User>): Promise<User> {
    const user = await this.userRepository.preload({
      id,
      ...dto,
    });
    if (!user) {
      throw new NotFoundException(`User with this ID not found`);
    }
    const savedUser = await this.userRepository.save(user);

    this.logger.log(`[User] Profile updated for user ID: ${id}`);
    this.eventEmitter.emit('user.updated', savedUser);
    return savedUser;
  }

  async updatePassword(id: string, dto: UpdatePasswordDto): Promise<boolean> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) throw new NotFoundException(`User with this ID not found`);

    const isValidPassword = await argon2.verify(
      user.passwordHash,
      dto.oldPassword,
    );
    if (!isValidPassword) {
      this.logger.warn(
        `[User] Failed password update attempt for user ${user.email} (Invalid old password).`,
      );
      throw new BadRequestException(`Invalid old password`);
    }

    user.passwordHash = await argon2.hash(dto.newPassword);
    await this.userRepository.save(user);

    this.logger.log(
      `[User] Password successfully updated for user: ${user.email}`,
    );
    this.eventEmitter.emit('user.password.updated', user);
    return true;
  }

  async remove(id: string): Promise<boolean> {
    this.logger.warn(`[User] Deleting user account ID: ${id}`);

    // Notify listeners (e.g., billing to unsubscribe LiqPay recurring orders) before CASCADE deletes relations
    await this.eventEmitter.emitAsync('user.before_deleted', { userId: id });

    const result = await this.userRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`User with this ID not found`);
    }

    this.eventEmitter.emit('user.deleted', { id });
    return true;
  }
}
