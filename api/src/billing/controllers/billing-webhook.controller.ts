import {
  Controller,
  Post,
  Body,
  Logger,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LiqPayService } from '../../infrastructure/liqpay/liqpay.service';
import { SubscriptionService } from '../services/subscription.service';
import { PaymentService } from '../services/payment.service';
import { PlanType } from '../enums/subscription-plan.enum';

@ApiTags('Billing/Webhook')
@Controller('billing/webhook')
export class BillingWebhookController {
  private readonly logger = new Logger(BillingWebhookController.name);

  constructor(
    private readonly liqPayService: LiqPayService,
    private readonly subscriptionService: SubscriptionService,
    private readonly paymentService: PaymentService,
  ) {}

  @ApiOperation({
    summary: 'LiqPay webhook callback',
    description:
      'Ендпоінт для отримання сповіщень від LiqPay про статус платежу. ' +
      'Викликається автоматично LiqPay після кожного успішного/неуспішного списання. ' +
      'Не захищений JWT — захист через верифікацію підпису LiqPay.',
  })
  @ApiResponse({ status: 200, description: 'Webhook handled.' })
  @ApiResponse({
    status: 400,
    description: 'Invalid signature or missing data.',
  })
  @HttpCode(HttpStatus.OK)
  @Post('liqpay')
  async handleLiqPayCallback(
    @Body('data') data: string,
    @Body('signature') signature: string,
  ): Promise<{ status: string }> {
    if (!data || !signature) {
      throw new BadRequestException('Missing data or signature');
    }

    const isValid = this.liqPayService.verifySignature(data, signature);
    if (!isValid) {
      this.logger.warn(
        `[LiqPay Webhook] Invalid signature received. Signature: ${signature.substring(0, 10)}...`,
      );
      throw new BadRequestException('Invalid signature');
    }

    const callbackData = this.liqPayService.decodeCallbackData(data);
    this.logger.log(
      `[LiqPay Webhook] Data received: status="${callbackData.status}", order_id="${callbackData.order_id}", amount="${callbackData.amount} ${callbackData.currency}"`,
    );

    const existingPayment = await this.paymentService.findByOrderId(
      callbackData.order_id,
    );
    if (existingPayment) {
      this.logger.log(
        `[LiqPay Webhook] Duplicate webhook ignored for order_id: ${callbackData.order_id}`,
      );
      return { status: 'already_processed' };
    }

    const userId = this.extractUserIdFromOrderId(callbackData.order_id);
    const planType = this.extractPlanTypeFromOrderId(callbackData.order_id);

    await this.paymentService.createFromCallback(callbackData, userId);

    if (
      callbackData.status === 'subscribed' ||
      callbackData.status === 'success'
    ) {
      if (userId && planType) {
        const isRenewal = callbackData.action === 'regular';

        if (isRenewal) {
          await this.subscriptionService.renewSubscription(userId);
          this.logger.log(
            `[LiqPay Webhook] Subscription RENEWED for user: ${userId}`,
          );
        } else {
          await this.subscriptionService.activateSubscription(
            userId,
            planType,
            callbackData.order_id,
          );
          this.logger.log(
            `[LiqPay Webhook] Subscription ACTIVATED for user: ${userId}, plan: ${planType}`,
          );
        }
      }
    } else {
      this.logger.warn(
        `[LiqPay Webhook] Non-success status: "${callbackData.status}" for order "${callbackData.order_id}"`,
      );
    }

    return { status: 'ok' };
  }

  private extractUserIdFromOrderId(orderId: string): string | null {
    const parts = orderId.split('_');
    if (parts.length >= 4 && parts[0] === 'sub') {
      return parts[1];
    }
    return null;
  }

  private extractPlanTypeFromOrderId(orderId: string): PlanType | null {
    const parts = orderId.split('_');
    if (parts.length >= 4 && parts[0] === 'sub') {
      const planStr = parts[2]?.toUpperCase();
      if (Object.values(PlanType).includes(planStr as PlanType)) {
        return planStr as PlanType;
      }
    }
    return null;
  }
}
