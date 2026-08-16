import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { AiRequestLimitService } from '../services/ai-request-limit.service';
import { SubscriptionService } from '../../billing/services/subscription.service';
import { PLAN_CONFIGS } from '../../billing/constants/plan-config.constants';

@Injectable()
export class AiRequestLimitGuard implements CanActivate {
  constructor(
    private readonly aiRequestLimitService: AiRequestLimitService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user.id;

    const planType = await this.subscriptionService.getUserPlanType(userId);
    const plan = PLAN_CONFIGS[planType];

    const dailyCount =
      await this.aiRequestLimitService.getDailyMessageCount(userId);

    if (dailyCount >= plan.features.maxAiRequestsPerDay) {
      throw new ForbiddenException(
        `Daily AI request limit reached for ${plan.name} plan (${plan.features.maxAiRequestsPerDay} requests/day). Please upgrade your subscription plan to get more requests.`,
      );
    }

    return true;
  }
}
