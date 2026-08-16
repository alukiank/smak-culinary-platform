import {
  Controller,
  Get,
  Body,
  Put,
  Param,
  Delete,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserService } from '../user.service';
import { UpdateUserAdminDto } from '../dto/update-user-admin.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { RolesAllowed } from '../../auth/decorators/roles-allowed.decorator';
import { UserRoleEnum } from '../enums/user-role.enum';
import { UserSearchAdminDto } from '../dto/user-search-admin.dto';
import { PaginatedResponseDto } from '../../shared/dto/paginated-response.dto';
import { UserPrivateDto } from '../dto/user-private.dto';
import { plainToInstance } from 'class-transformer';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiCookieAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('Admin/Users')
@ApiCookieAuth('jwt-access')
@UseGuards(AuthGuard('jwt-access'), RolesGuard)
@RolesAllowed(UserRoleEnum.ADMIN)
@Controller('admin/users')
export class UserAdminController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({
    summary: '[ADMIN] Отримання списку всіх користувачів',
    description:
      'Повертає посторінковий список усіх користувачів системи з можливістю фільтрації за роллю, ' +
      'статусом бану, статусом верифікації та текстовим пошуком. Включає повні приватні дані ' +
      '(email, роль, статус верифікації та бану). Доступно лише для адміністраторів.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Номер сторінки (за замовчуванням 1).',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Кількість користувачів на сторінку (за замовчуванням 10).',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Текстовий пошук за username, email або displayname.',
  })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: UserRoleEnum,
    description: 'Фільтр за роллю користувача.',
  })
  @ApiQuery({
    name: 'isBanned',
    required: false,
    type: Boolean,
    description: 'Фільтр за статусом бану.',
  })
  @ApiQuery({
    name: 'isVerified',
    required: false,
    type: Boolean,
    description: 'Фільтр за статусом верифікації email.',
  })
  @ApiResponse({
    status: 200,
    description: 'Список користувачів з метаданими пагінації.',
    schema: {
      example: {
        data: [
          {
            id: 'user-uuid',
            username: 'john_doe',
            displayname: 'John Doe',
            email: 'john@example.com',
            role: 'user',
            isBanned: false,
            isVerified: true,
          },
        ],
        meta: {
          totalItems: 50,
          itemCount: 10,
          itemsPerPage: 10,
          totalPages: 5,
          currentPage: 1,
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden — ADMIN role required.' })
  @Get()
  async findAllByAdmin(
    @Query() searchDto: UserSearchAdminDto,
  ): Promise<PaginatedResponseDto<UserPrivateDto>> {
    const paginatedUsers = await this.userService.findAll(searchDto);
    const mappedData = plainToInstance(UserPrivateDto, paginatedUsers.data, {
      excludeExtraneousValues: true,
    });
    return new PaginatedResponseDto(mappedData, paginatedUsers.meta);
  }

  @ApiOperation({
    summary: '[ADMIN] Отримання даних конкретного користувача',
    description:
      'Повертає повні приватні дані конкретного користувача за UUID ' +
      '(id, username, displayname, email, роль, статус бану та верифікації). ' +
      'Доступно лише для адміністраторів.',
  })
  @ApiParam({ name: 'id', description: 'UUID користувача.', type: String })
  @ApiResponse({
    status: 200,
    description: 'Повні дані користувача.',
    type: UserPrivateDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden — ADMIN role required.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @Get(':id')
  async findOneByAdmin(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<UserPrivateDto> {
    const user = await this.userService.findOne({ id });
    return plainToInstance(UserPrivateDto, user, {
      excludeExtraneousValues: true,
    });
  }

  @ApiOperation({
    summary: '[ADMIN] Оновлення даних користувача',
    description:
      'Дозволяє адміністратору змінити displayname, роль (user/admin) та статус бану (isBanned) будь-якого користувача. ' +
      "Всі поля є необов'язковими (часткове оновлення). " +
      'Встановлення isBanned = true забороняє доступ користувача до захищених ресурсів (перевіряється через сесію). ' +
      'Після оновлення кеш сесії у Redis синхронізується через подію user.updated. ' +
      'Доступно лише для адміністраторів.',
  })
  @ApiParam({ name: 'id', description: 'UUID користувача.', type: String })
  @ApiBody({ type: UpdateUserAdminDto })
  @ApiResponse({
    status: 200,
    description: 'Дані користувача успішно оновлено.',
    type: UserPrivateDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error — invalid role or isBanned value.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden — ADMIN role required.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @Put(':id')
  async updateByAdmin(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateUserAdminDto,
  ): Promise<UserPrivateDto> {
    const user = await this.userService.update(id, dto);
    return plainToInstance(UserPrivateDto, user, {
      excludeExtraneousValues: true,
    });
  }

  @ApiOperation({
    summary: '[ADMIN] Видалення облікового запису користувача',
    description:
      'Примусово видаляє обліковий запис будь-якого користувача. ' +
      "Операція незворотна — всі пов'язані дані видаляються через CASCADE. " +
      "Після видалення генерується подія user.deleted для очищення пов'язаних ресурсів. " +
      'Доступно лише для адміністраторів.',
  })
  @ApiParam({ name: 'id', description: 'UUID користувача.', type: String })
  @ApiResponse({
    status: 200,
    description: 'Account successfully deleted — returns true.',
    schema: { example: true },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden — ADMIN role required.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @Delete(':id')
  async removeByAdmin(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<boolean> {
    return this.userService.remove(id);
  }
}
