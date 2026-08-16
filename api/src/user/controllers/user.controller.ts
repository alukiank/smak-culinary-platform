import {
  Controller,
  Get,
  Body,
  Put,
  Param,
  Delete,
  ParseUUIDPipe,
  UseGuards,
  Patch,
  NotFoundException,
} from '@nestjs/common';
import { UserService } from '../user.service';
import { RecipeReviewService } from '../../recipe-review/recipe-review.service';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UpdatePasswordDto } from '../dto/update-password.dto';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { UserPrivateDto } from '../dto/user-private.dto';
import { UserPublicDto } from '../dto/user-public.dto';
import { UserRestrictionsDto } from '../dto/user-restrictions.dto';
import { plainToInstance } from 'class-transformer';
import { RestrictionsLimitGuard } from '../guards/restrictions-limit.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiCookieAuth,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly recipeReviewService: RecipeReviewService,
  ) {}

  @ApiOperation({
    summary: 'Отримання профілю поточного користувача',
    description:
      'Повертає приватні дані профілю поточного авторизованого користувача: ' +
      'id, username, displayname, email, роль (user/admin), статус бану та статус верифікації email.',
  })
  @ApiCookieAuth('jwt-access')
  @ApiResponse({
    status: 200,
    description: 'Профіль поточного користувача.',
    type: UserPrivateDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized — access-токен відсутній або недійсний.',
  })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @UseGuards(AuthGuard('jwt-access'))
  @Get('me')
  async getMe(@CurrentUser('id') id: string): Promise<UserPrivateDto> {
    const user = await this.userService.findOne({ id });
    return plainToInstance(UserPrivateDto, user, {
      excludeExtraneousValues: true,
    });
  }

  @ApiOperation({
    summary: 'Отримання обмежень поточного користувача',
    description:
      'Повертає обмеження поточного авторизованого користувача: ' +
      'allergies та dietary як масиви рядків.',
  })
  @ApiCookieAuth('jwt-access')
  @ApiResponse({
    status: 200,
    description: 'Обмеження поточного користувача.',
    type: UserRestrictionsDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized — access-токен відсутній або недійсний.',
  })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @UseGuards(AuthGuard('jwt-access'))
  @Get('me/restrictions')
  async getMeRestrictions(
    @CurrentUser('id') id: string,
  ): Promise<UserRestrictionsDto> {
    const userRestrictions = await this.userService.findUserRestrictions(id);
    return plainToInstance(UserRestrictionsDto, userRestrictions, {
      excludeExtraneousValues: true,
    });
  }

  @ApiOperation({
    summary: 'Оновлення профілю поточного користувача',
    description:
      'Оновлює дані профілю поточного авторизованого користувача: ' +
      'username, displayname, email, dietary (дієтичні вподобання) та allergies (алергени). ' +
      "Всі поля є необов'язковими (часткове оновлення). " +
      'Після оновлення кеш сесії у Redis синхронізується автоматично через подію user.updated.',
  })
  @ApiCookieAuth('jwt-access')
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({
    status: 200,
    description: 'Профіль успішно оновлено.',
    type: UserPrivateDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error — invalid email or other field format.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description:
      'Forbidden - Adding/updating allergies or dietary preferences is not allowed on the Free plan. Please upgrade to Pro or Premium.',
  })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @UseGuards(AuthGuard('jwt-access'), RestrictionsLimitGuard)
  @Put('me')
  async updateMe(
    @CurrentUser('id') id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserPrivateDto> {
    const user = await this.userService.update(id, dto);
    return plainToInstance(UserPrivateDto, user, {
      excludeExtraneousValues: true,
    });
  }

  @ApiOperation({
    summary: 'Зміна пароля поточного користувача',
    description:
      'Змінює пароль поточного авторизованого користувача. ' +
      'Необхідно передати старий пароль (oldPassword) для підтвердження особи та новий пароль (newPassword). ' +
      'Вимоги до нового пароля: мінімум 12 символів, хоча б одна велика буква, одна мала буква, ' +
      'одна цифра та один спецсимвол (!@#$%^&*(),.?":{}|<>). ' +
      'Пароль хешується алгоритмом Argon2. Після успішної зміни сесія не інвалідується.',
  })
  @ApiCookieAuth('jwt-access')
  @ApiBody({ type: UpdatePasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password successfully changed — returns true.',
    schema: { example: true },
  })
  @ApiResponse({
    status: 400,
    description:
      'Invalid old password or new password does not meet security requirements.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @UseGuards(AuthGuard('jwt-access'))
  @Patch('me/password')
  async updateMyPassword(
    @CurrentUser('id') id: string,
    @Body() dto: UpdatePasswordDto,
  ): Promise<boolean> {
    return this.userService.updatePassword(id, dto);
  }

  @ApiOperation({
    summary: 'Видалення облікового запису поточного користувача',
    description:
      'Повністю видаляє обліковий запис поточного авторизованого користувача. ' +
      'Операція незворотна — всі дані користувача видаляються з бази даних (включаючи рецепти, відгуки тощо через CASCADE). ' +
      "Після видалення генерується подія user.deleted для очищення пов'язаних ресурсів (Cloudinary, Redis тощо).",
  })
  @ApiCookieAuth('jwt-access')
  @ApiResponse({
    status: 200,
    description: 'Account successfully deleted — returns true.',
    schema: { example: true },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @UseGuards(AuthGuard('jwt-access'))
  @Delete('me')
  async deleteMe(@CurrentUser('id') id: string): Promise<boolean> {
    return this.userService.remove(id);
  }

  @ApiOperation({
    summary: 'Отримання публічного профілю користувача',
    description:
      'Повертає публічну інформацію про будь-якого користувача за UUID: ' +
      'id, username та displayname. ' +
      'Приватні дані (email, роль, статус верифікації) не повертаються. ' +
      'Авторизація не вимагається.',
  })
  @ApiParam({ name: 'id', description: 'UUID користувача.', type: String })
  @ApiResponse({
    status: 200,
    description: 'Public profile of the user.',
    type: UserPublicDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid UUID format.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @Get(':id')
  async findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<UserPublicDto> {
    const user = await this.userService.findOne({ id });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    const stats = await this.recipeReviewService.getAuthorStats(id);
    return plainToInstance(UserPublicDto, {
      ...user,
      averageRating: stats.averageRating,
      totalReviews: stats.totalReviews,
    }, {
      excludeExtraneousValues: true,
    });
  }
}
