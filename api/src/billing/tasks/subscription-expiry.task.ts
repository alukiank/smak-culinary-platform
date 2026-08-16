import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SubscriptionService } from '../services/subscription.service';

@Injectable()
export class SubscriptionExpiryTask {
  private readonly logger = new Logger(SubscriptionExpiryTask.name);

  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async handleSubscriptionExpiry(): Promise<void> {
    this.logger.log(
      '[Cron] Starting subscription expiry and grace period check...',
    );

    try {
      await this.subscriptionService.markExpiredAsPayDue();
      await this.subscriptionService.expirePastDueSubscriptions();

      this.logger.log(
        '[Cron] Subscription expiry check completed successfully.',
      );
    } catch (error) {
      this.logger.error(
        `[Cron] Error during subscription expiry check: ${error.message}`,
        error.stack,
      );
    }
  }
}
