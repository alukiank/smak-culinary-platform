import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecipeCollection } from '../entities/recipe-collection.entity';
import { SubscriptionService } from '../../billing/services/subscription.service';
import { PLAN_CONFIGS } from '../../billing/constants/plan-config.constants';

@Injectable()
export class CollectionLimitGuard implements CanActivate {
  constructor(
    @InjectRepository(RecipeCollection)
    private readonly collectionRepository: Repository<RecipeCollection>,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user.id;

    if (request.method !== 'POST') return true;

    const planType = await this.subscriptionService.getUserPlanType(userId);
    const plan = PLAN_CONFIGS[planType];

    const currentCount = await this.collectionRepository.count({
      where: { userId },
    });

    if (currentCount >= plan.features.maxCollections) {
      throw new ForbiddenException(
        `Limit reached for ${plan.name} plan. Max collections: ${plan.features.maxCollections}`,
      );
    }

    return true;
  }
}
