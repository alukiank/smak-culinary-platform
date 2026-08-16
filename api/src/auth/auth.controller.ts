import {
  Controller,
  UseGuards,
  Query,
  Body,
  Post,
  Res,
  Get,
} from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { VerificationService } from './services/verification.service';
import { TokenService } from './services/token.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { Response } from 'express';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthGuard } from '@nestjs/passport';
import { User } from '../user/entities/user.entity';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UserPrivateDto } from '../user/dto/user-private.dto';
import { SensitiveActionThrottle } from '../infrastructure/rate-limiting/decorators/sensitive-action-throttle.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiQuery,
  ApiCookieAuth,
} from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly verificationService: VerificationService,
    private readonly tokenService: TokenService,
  ) { }

  @ApiOperation({
    summary: 'Реєстрація нового користувача',
    description:
      'Створює новий обліковий запис користувача. Автоматично надсилає лист для підтвердження email. ' +
      'Повертає пару токенів (access + refresh) та встановлює їх у HTTP-only cookies. ' +
      'Обмежений rate-limiter для захисту від брутфорсу.',
  })
  @ApiBody({ type: SignupDto })
  @ApiResponse({
    status: 201,
    description: 'Успішна реєстрація. Повертає accessToken та refreshToken.',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Помилка валідації — невірний формат email, занадто короткий пароль або не виконано вимоги до пароля (мінімум 12 символів, велика/мала буква, цифра, спецсимвол).',
  })
  @ApiResponse({
    status: 409,
    description: 'Конфлікт — користувач із таким username або email вже існує.',
  })
  @ApiResponse({
    status: 429,
    description:
      'Забагато запитів — перевищено ліміт спроб реєстрації (rate-limiting).',
  })
  @SensitiveActionThrottle()
  @Post('signup')
  async signup(
    @Body() dto: SignupDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    return await this.authService.signup(dto, res);
  }

  @ApiOperation({
    summary: 'Вхід у систему (логін)',
    description:
      'Автентифікує користувача за email та паролем (через Passport Local Strategy). ' +
      'Повертає пару токенів та встановлює їх у HTTP-only cookies. ' +
      'Обмежений rate-limiter для захисту від брутфорсу.',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 201,
    description: 'Успішний логін. Повертає accessToken та refreshToken.',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Помилка валідації — невірний формат email або пароль не відповідає вимогам.',
  })
  @ApiResponse({
    status: 401,
    description: 'Неавторизовано — невірний email або пароль.',
  })
  @ApiResponse({
    status: 429,
    description:
      'Забагато запитів — перевищено ліміт спроб входу (rate-limiting).',
  })
  @SensitiveActionThrottle()
  @UseGuards(AuthGuard('local'))
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @CurrentUser() user: User,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    return await this.authService.login(user, res);
  }

  @ApiOperation({
    summary: 'Оновлення пари токенів (refresh)',
    description:
      'Генерує нову пару access/refresh токенів на основі дійсного refresh-токена. ' +
      'Refresh-токен передається через HTTP-only cookie (jwt-refresh). ' +
      'Старий refresh-токен інвалідується після успішного оновлення.',
  })
  @ApiCookieAuth('jwt-refresh')
  @ApiResponse({
    status: 201,
    description:
      'Токени успішно оновлено. Повертає новий accessToken та refreshToken.',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description:
      'Неавторизовано — refresh-токен відсутній, недійсний або прострочений.',
  })
  @UseGuards(AuthGuard('jwt-refresh'))
  @Post('refresh')
  async refresh(
    @CurrentUser('id') userId: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    return await this.tokenService.generateAndSetTokens(userId, res);
  }

  @ApiOperation({
    summary: 'Вихід із системи (logout)',
    description:
      'Інвалідує поточну сесію користувача у Redis кеші та очищає cookies з токенами. ' +
      'Потребує дійсного access-токена у заголовку Authorization.',
  })
  @ApiCookieAuth('jwt-access')
  @ApiResponse({
    status: 201,
    description: 'Успішний вихід — повертає true, cookies очищено.',
    schema: { example: true },
  })
  @ApiResponse({
    status: 401,
    description: 'Неавторизовано — access-токен відсутній або недійсний.',
  })
  @UseGuards(AuthGuard('jwt-access'))
  @Post('logout')
  async logout(
    @CurrentUser('id') userId: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<boolean> {
    return await this.authService.logout(userId, res);
  }

  @ApiOperation({
    summary: 'Отримання поточного авторизованого користувача',
    description:
      'Повертає дані поточного авторизованого користувача. ' +
      'Спочатку перевіряє Redis кеш (session), якщо не знайдено — звертається до бази даних. ' +
      'Повертає приватне DTO (з email, роллю, статусом верифікації тощо).',
  })
  @ApiCookieAuth('jwt-access')
  @ApiResponse({
    status: 200,
    description: 'Дані поточного користувача.',
    type: UserPrivateDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Неавторизовано — access-токен відсутній або недійсний.',
  })
  @ApiResponse({
    status: 404,
    description: 'Користувача не знайдено.',
  })
  @UseGuards(AuthGuard('jwt-access'))
  @Get('me')
  async me(@CurrentUser('id') userId: string): Promise<UserPrivateDto> {
    return await this.authService.me(userId);
  }

  @ApiOperation({
    summary: 'Підтвердження email-адреси',
    description:
      'Верифікує email користувача за одноразовим токеном, переданим у query-параметрі. ' +
      'Токен надсилається на email під час реєстрації або при повторному надсиланні листа. ' +
      'Після успішної верифікації токен видаляється з Redis.',
  })
  @ApiQuery({
    name: 'token',
    description:
      'Одноразовий токен підтвердження email (hex-рядок з 64 символів).',
    required: true,
    type: String,
  })
  @ApiResponse({
    status: 201,
    description: 'Email успішно підтверджено — повертає true.',
    schema: { example: true },
  })
  @ApiResponse({
    status: 400,
    description:
      'Некоректний або прострочений токен. Або email вже підтверджено.',
  })
  @Post('verify-email')
  async verify(@Query('token') token: string): Promise<boolean> {
    return await this.verificationService.verifyEmail(token);
  }

  @ApiOperation({
    summary: 'Повторне надсилання листа підтвердження email',
    description:
      'Генерує новий токен верифікації та надсилає його на email поточного авторизованого користувача. ' +
      'Доступно лише для користувачів, чий email ще не підтверджено. ' +
      'Обмежений rate-limiter для запобігання спаму.',
  })
  @ApiCookieAuth('jwt-access')
  @ApiResponse({
    status: 201,
    description: 'Лист успішно надіслано — повертає true.',
    schema: { example: true },
  })
  @ApiResponse({
    status: 400,
    description:
      'Email вже підтверджено або користувач з таким email не знайдений.',
  })
  @ApiResponse({
    status: 401,
    description: 'Неавторизовано — access-токен відсутній або недійсний.',
  })
  @ApiResponse({
    status: 429,
    description:
      'Забагато запитів — перевищено ліміт повторних надсилань (rate-limiting).',
  })
  @SensitiveActionThrottle()
  @Post('resend-email-verification')
  @UseGuards(AuthGuard('jwt-access'))
  async resendVerification(
    @CurrentUser('email') email: string,
  ): Promise<boolean> {
    return await this.verificationService.resendVerification(email);
  }

  @ApiOperation({
    summary: 'Запит на скидання пароля (forgot password)',
    description:
      'Ініціює процедуру скидання пароля: генерує одноразовий токен та надсилає лист із посиланням для скидання. ' +
      'Якщо email не знайдено — повертає 400. ' +
      'Токен зберігається у Redis з TTL. ' +
      'Обмежений rate-limiter.',
  })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: 201,
    description: 'Лист для скидання пароля надіслано — повертає true.',
    schema: { example: true },
  })
  @ApiResponse({
    status: 400,
    description: 'Користувача з таким email не знайдено.',
  })
  @ApiResponse({
    status: 429,
    description: 'Забагато запитів (rate-limiting).',
  })
  @SensitiveActionThrottle()
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<boolean> {
    return await this.verificationService.forgotPassword(dto.email);
  }

  @ApiOperation({
    summary: 'Скидання пароля (reset password)',
    description:
      'Встановлює новий пароль для користувача на основі одноразового reset-токена. ' +
      'Токен перевіряється у Redis. Після успішного скидання: пароль оновлюється (хешується Argon2), ' +
      'токен видаляється з Redis, сесія користувача інвалідується. ' +
      'Вимоги до нового пароля: мінімум 12 символів, велика і мала літера, цифра, спецсимвол.',
  })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({
    status: 201,
    description: 'Пароль успішно змінено — повертає true.',
    schema: { example: true },
  })
  @ApiResponse({
    status: 400,
    description:
      'Токен недійсний або прострочений. Або новий пароль не відповідає вимогам безпеки.',
  })
  @ApiResponse({
    status: 429,
    description: 'Забагато запитів (rate-limiting).',
  })
  @SensitiveActionThrottle()
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<boolean> {
    return await this.verificationService.resetPassword(
      dto.token,
      dto.password,
    );
  }
}
