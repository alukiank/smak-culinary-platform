import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SubscriptionService } from '../services/subscription.service';
import { PlanType } from '../enums/subscription-plan.enum';

@Injectable()
export class UserRegisteredListener {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @OnEvent('user.registered')
  async handleUserCreated(payload: { userId: string }) {
    await this.subscriptionService.activateSubscription(
      payload.userId,
      PlanType.FREE,
      null,
    );
  }
}
