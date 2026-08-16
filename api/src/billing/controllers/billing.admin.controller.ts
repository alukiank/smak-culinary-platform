import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesAllowed } from '../../auth/decorators/roles-allowed.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { UserRoleEnum } from '../../user/enums/user-role.enum';
import { SubscriptionService } from '../services/subscription.service';
import { PaymentService } from '../services/payment.service';
import { UpdateSubscriptionDto } from '../dto/update-subscription.dto';
import { plainToInstance } from 'class-transformer';
import { SubscriptionResponseDto } from '../dto/subscription-response.dto';
import { PaymentResponseDto } from '../dto/payment-response.dto';
import { PaginationDto } from '../../shared/dto/pagination.dto';
import { PaginatedResponseDto } from '../../shared/dto/paginated-response.dto';
import { SubscriptionSearchAdminDto } from '../dto/subscription-search-admin.dto';
import { PaymentSearchAdminDto } from '../dto/payment-search-admin.dto';
import { PlanType } from '../enums/subscription-plan.enum';
import { SubscriptionStatus } from '../enums/subscription-status.enum';
import { PaymentStatus } from '../enums/payment-status.enum';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiCookieAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('Admin/Billing')
@ApiCookieAuth('jwt-access')
@Controller('admin/billing')
@UseGuards(AuthGuard('jwt-access'), RolesGuard)
@RolesAllowed(UserRoleEnum.ADMIN)
export class BillingAdminController {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly paymentService: PaymentService,
  ) {}

  @ApiOperation({
    summary: '[ADMIN] Отримання підписок',
    description:
      'Повертає список підписок у системі. Можна фільтрувати за userId. ' +
      'Включає підписки з будь-яким статусом: ACTIVE, EXPIRED, CANCELED. ' +
      'Доступно лише для адміністраторів.',
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
    description: 'Кількість елементів на сторінку (за замовчуванням 10).',
  })
  @ApiQuery({
    name: 'userId',
    description: 'UUID користувача для фільтрації.',
    required: false,
    type: String,
  })
  @ApiQuery({
    name: 'planType',
    description: 'Фільтр за типом плану.',
    required: false,
    enum: PlanType,
  })
  @ApiQuery({
    name: 'status',
    description: 'Фільтр за статусом підписки.',
    required: false,
    enum: SubscriptionStatus,
  })
  @ApiResponse({
    status: 200,
    description: 'Список підписок з пагінацією.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Access denied - ADMIN role required.',
  })
  @Get('subscriptions')
  async findAll(
    @Query() searchDto: SubscriptionSearchAdminDto,
  ): Promise<PaginatedResponseDto<SubscriptionResponseDto>> {
    const paginatedResult = await this.subscriptionService.findAll(
      searchDto,
      searchDto,
    );
    const mappedData = plainToInstance(
      SubscriptionResponseDto,
      paginatedResult.data,
      { excludeExtraneousValues: true },
    );
    return new PaginatedResponseDto(mappedData, paginatedResult.meta);
  }

  @ApiOperation({
    summary: '[ADMIN] Отримання підписки за ID',
    description:
      "Повертає деталі конкретної підписки за її UUID, включаючи дані пов'язаного користувача. " +
      'Доступно лише для адміністраторів.',
  })
  @ApiParam({ name: 'id', description: 'UUID підписки.', type: String })
  @ApiResponse({
    status: 200,
    description: 'Дані підписки.',
    type: SubscriptionResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Access denied - ADMIN role required.',
  })
  @ApiResponse({ status: 404, description: 'Subscription not found.' })
  @Get('subscriptions/:id')
  async findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<SubscriptionResponseDto> {
    const subscription = await this.subscriptionService.findOne(id);
    return plainToInstance(SubscriptionResponseDto, subscription, {
      excludeExtraneousValues: true,
    });
  }

  @ApiOperation({
    summary: '[ADMIN] Оновлення підписки',
    description:
      'Дозволяє адміністратору вручну змінити тип плану (FREE/PRO/PREMIUM), ' +
      'статус (ACTIVE/EXPIRED/CANCELED) або дату закінчення поточного платіжного періоду. ' +
      "Всі поля є необов'язковими (часткове оновлення). Доступно лише для адміністраторів.",
  })
  @ApiParam({ name: 'id', description: 'UUID підписки.', type: String })
  @ApiBody({ type: UpdateSubscriptionDto })
  @ApiResponse({
    status: 200,
    description: 'Підписку успішно оновлено.',
    type: SubscriptionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Validation error - invalid planType, status or currentPeriodEnd.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Access denied - ADMIN role required.',
  })
  @ApiResponse({ status: 404, description: 'Subscription not found.' })
  @Patch('subscriptions/:id')
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateSubscriptionDto,
  ): Promise<SubscriptionResponseDto> {
    const updatedSubscription = await this.subscriptionService.update(id, dto);
    return plainToInstance(SubscriptionResponseDto, updatedSubscription, {
      excludeExtraneousValues: true,
    });
  }

  @ApiOperation({
    summary: '[ADMIN] Отримання платежів',
    description:
      'Повертає список платіжних транзакцій у системі у порядку спадання. ' +
      'Можна фільтрувати за userId. Доступно лише для адміністраторів.',
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
    description: 'Кількість елементів на сторінку (за замовчуванням 10).',
  })
  @ApiQuery({
    name: 'userId',
    description: 'UUID користувача для фільтрації.',
    required: false,
    type: String,
  })
  @ApiQuery({
    name: 'status',
    description: 'Фільтр за статусом платежу.',
    required: false,
    enum: PaymentStatus,
  })
  @ApiResponse({
    status: 200,
    description: 'Список платежів з пагінацією.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Access denied - ADMIN role required.',
  })
  @Get('payments')
  async findAllPayments(
    @Query() searchDto: PaymentSearchAdminDto,
  ): Promise<PaginatedResponseDto<PaymentResponseDto>> {
    const paginatedResult = await this.paymentService.findAll(
      searchDto,
      searchDto,
    );
    const mappedData = plainToInstance(
      PaymentResponseDto,
      paginatedResult.data,
      { excludeExtraneousValues: true },
    );
    return new PaginatedResponseDto(mappedData, paginatedResult.meta);
  }

  @ApiOperation({
    summary: '[ADMIN] Отримання конкретного платежу за ID',
    description:
      'Повертає деталі конкретної платіжної транзакції за її UUID, ' +
      "включаючи дані пов'язаного користувача. Доступно лише для адміністраторів.",
  })
  @ApiParam({ name: 'id', description: 'UUID платежу.', type: String })
  @ApiResponse({
    status: 200,
    description: 'Дані платежу.',
    type: PaymentResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Access denied - ADMIN role required.',
  })
  @ApiResponse({ status: 404, description: 'Payment not found.' })
  @Get('payments/:id')
  async findOnePayment(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<PaymentResponseDto> {
    const payment = await this.paymentService.findOne(id);
    return plainToInstance(PaymentResponseDto, payment, {
      excludeExtraneousValues: true,
    });
  }
}
