import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SubscriptionService } from '../services/subscription.service';
import { PlanType } from '../enums/subscription-plan.enum';

@Injectable()
export class UserRegisteredListener {
  private readonly logger = new Logger(UserRegisteredListener.name);

  constructor(private readonly subscriptionService: SubscriptionService) {}

  @OnEvent('user.registered')
  async handleUserCreated(payload: { userId: string }) {
    try {
      await this.subscriptionService.activateSubscription(
        payload.userId,
        PlanType.FREE,
        null,
      );
    } catch (error) {
      this.logger.error(
        `[UserRegisteredListener] Failed to activate initial FREE subscription for user ${payload.userId}: ${error.message}`,
        error.stack,
      );
    }
  }
}
