import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SubscriptionService } from '../services/subscription.service';

@Injectable()
export class UserDeletedSubscriptionListener {
  private readonly logger = new Logger(UserDeletedSubscriptionListener.name);

  constructor(private readonly subscriptionService: SubscriptionService) {}

  @OnEvent('user.before_deleted')
  async handleUserBeforeDeleted(payload: { userId: string } | string) {
    const userId = typeof payload === 'string' ? payload : payload?.userId;
    if (!userId) return;

    this.logger.log(
      `[Billing Listener] Received user.before_deleted for user ID: ${userId}. Checking subscription to cancel LiqPay recurring orders.`,
    );
    await this.subscriptionService.handleUserDeleted(userId);
  }
}
