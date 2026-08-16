import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { SubscriptionService } from '../../billing/services/subscription.service';
import { PLAN_CONFIGS } from '../../billing/constants/plan-config.constants';

@Injectable()
export class RestrictionsLimitGuard implements CanActivate {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user.id;
    const { allergies, dietary } = request.body;

    const isUpdatingRestrictions =
      (allergies && allergies.length > 0) || (dietary && dietary.length > 0);

    if (isUpdatingRestrictions) {
      const planType = await this.subscriptionService.getUserPlanType(userId);
      const plan = PLAN_CONFIGS[planType];

      if (!plan.features.allowAllergiesAndDiets) {
        throw new ForbiddenException(
          `Adding allergies or dietary preferences is not allowed on the ${plan.name} plan. Please upgrade your subscription.`,
        );
      }
    }

    return true;
  }
}
