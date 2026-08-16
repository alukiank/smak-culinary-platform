import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  Query,
} from '@nestjs/common';
import { PaginationDto } from '../../shared/dto/pagination.dto';
import { AuthGuard } from '@nestjs/passport';
import { EmailVerificationGuard } from '../../auth/guards/email-verification.guard';
import { SubscriptionService } from '../services/subscription.service';
import { PaymentService } from '../services/payment.service';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { CreateCheckoutDto } from '../dto/create-checkout.dto';
import { CheckoutResponseDto } from '../dto/checkout-response.dto';
import { PLAN_CONFIGS } from '../constants/plan-config.constants';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
  ApiBody,
} from '@nestjs/swagger';
import { PlanConfig } from '../interfaces/subscription-plan-config.interface';

@ApiTags('Billing')
@ApiCookieAuth('jwt-access')
@Controller('billing')
@UseGuards(AuthGuard('jwt-access'))
export class BillingController {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly paymentService: PaymentService,
  ) {}

  @ApiOperation({
    summary: 'Список доступних тарифних планів',
    description:
      'Повертає всі доступні тарифні плани з цінами та описом можливостей. ' +
      'Публічний ендпоінт — можна відображати на сторінці ціноутворення.',
  })
  @ApiResponse({
    status: 200,
    description: 'Список тарифних планів.',
    schema: {
      example: [
        {
          planType: 'FREE',
          name: 'Free',
          price: 0,
          currency: 'UAH',
          features: ['...'],
        },
        {
          planType: 'PRO',
          name: 'Pro',
          price: 149,
          currency: 'UAH',
          features: ['...'],
        },
      ],
    },
  })
  @Get('plans')
  getPlans(): PlanConfig[] {
    return Object.values(PLAN_CONFIGS);
  }

  @ApiOperation({
    summary: 'Отримання підписки поточного користувача',
    description:
      'Повертає дані активної підписки поточного авторизованого користувача. ' +
      'Підписка містить інформацію про тип плану (FREE/PRO/PREMIUM), ' +
      'статус (ACTIVE/PAST_DUE/EXPIRED/CANCELED) та дату закінчення поточного периоду. ' +
      'Якщо підписки не існує — повертає 404.',
  })
  @ApiResponse({
    status: 200,
    description: 'Subscription data for the current user.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 404,
    description: 'Subscription not found for the current user.',
  })
  @Get('subscription/me')
  getSubscription(@CurrentUser('id') userId: string) {
    return this.subscriptionService.findByUserId(userId);
  }

  @ApiOperation({
    summary: 'Ініціація оплати підписки',
    description:
      'Генерує параметри для LiqPay Checkout Widget (data + signature). ' +
      'Фронтенд передає ці дані у LiqPay JS SDK для відображення форми оплати. ' +
      'Після успішної оплати LiqPay автоматично надішле webhook і підписка буде активована. ' +
      'FREE план не можна оплатити — він призначається автоматично.',
  })
  @ApiBody({ type: CreateCheckoutDto })
  @ApiResponse({
    status: 201,
    type: CheckoutResponseDto,
    description: 'Parameters for LiqPay Checkout.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid planType or attempt to pay for FREE plan.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user email is not confirmed.',
  })
  @UseGuards(EmailVerificationGuard)
  @Post('checkout')
  createCheckout(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCheckoutDto,
  ): Promise<CheckoutResponseDto> {
    return this.subscriptionService.createCheckout(userId, dto.planType);
  }

  @ApiOperation({
    summary: 'Скасування підписки',
    description:
      'Скасовує поточну підписку користувача. ' +
      'Доступ до платних функцій зберігається до кінця оплаченого периоду (currentPeriodEnd). ' +
      'Після цього підписка переводиться на FREE план. ' +
      'Наступного автоматичного списання LiqPay не буде.',
  })
  @ApiResponse({ status: 200, description: 'Subscription canceled.' })
  @ApiResponse({
    status: 400,
    description: 'Subscription already canceled or plan is FREE.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Subscription not found.' })
  @HttpCode(HttpStatus.OK)
  @Post('subscription/cancel')
  cancelSubscription(@CurrentUser('id') userId: string) {
    return this.subscriptionService.cancelSubscription(userId);
  }

  @ApiOperation({
    summary: 'Отримання всіх платежів поточного користувача',
    description:
      'Повертає список усіх платіжних транзакцій поточного авторизованого користувача ' +
      'у порядку спадання (найновіші перші).',
  })
  @ApiResponse({
    status: 200,
    description: 'List of payments for the current user.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @Get('payments/me')
  getMyPayments(
    @CurrentUser('id') userId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.paymentService.findAll(paginationDto, { userId });
  }
}
