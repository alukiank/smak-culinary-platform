import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PaginationDto } from '../../shared/dto/pagination.dto';
import { PaginatedResponseDto } from '../../shared/dto/paginated-response.dto';
import { PaginationMetaDto } from '../../shared/dto/pagination-meta.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from '../entities/subscription.entity';
import { UpdateSubscriptionDto } from '../dto/update-subscription.dto';
import { PlanType } from '../enums/subscription-plan.enum';
import { SubscriptionStatus } from '../enums/subscription-status.enum';
import { LiqPayService } from '../../infrastructure/liqpay/liqpay.service';
import { PLAN_CONFIGS } from '../constants/plan-config.constants';
import { v4 as uuidv4 } from 'uuid';
import { CheckoutResult } from '../interfaces/subscription-checkout-result.interface';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    private readonly liqPayService: LiqPayService,
  ) {}

  async findAll(
    paginationDto: PaginationDto,
    filters?: {
      userId?: string;
      planType?: PlanType;
      status?: SubscriptionStatus;
    },
  ): Promise<PaginatedResponseDto<Subscription>> {
    const page = paginationDto.page || 1;
    const limit = paginationDto.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters?.userId) where.userId = filters.userId;
    if (filters?.planType) where.planType = filters.planType;
    if (filters?.status) where.status = filters.status;

    const [items, totalItems] = await this.subscriptionRepository.findAndCount({
      where,
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const meta = new PaginationMetaDto(totalItems, page, limit, items.length);
    return new PaginatedResponseDto(items, meta);
  }

  async findOne(id: string): Promise<Subscription> {
    const sub = await this.subscriptionRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!sub) throw new NotFoundException('Subscription not found');
    return sub;
  }

  async findByUserId(userId: string): Promise<Subscription> {
    const sub = await this.subscriptionRepository.findOne({
      where: { userId },
      relations: ['user'],
    });
    if (!sub)
      throw new NotFoundException('Subscription not found for this user');
    return sub;
  }

  async getUserPlanType(userId: string): Promise<PlanType> {
    try {
      const sub = await this.subscriptionRepository.findOne({
        where: { userId },
      });
      if (!sub) return PlanType.FREE;

      if (sub.status === SubscriptionStatus.ACTIVE) {
        return sub.planType;
      }

      if (
        sub.status === SubscriptionStatus.CANCELED &&
        sub.currentPeriodEnd &&
        sub.currentPeriodEnd > new Date()
      ) {
        return sub.planType;
      }

      return PlanType.FREE;
    } catch {
      return PlanType.FREE;
    }
  }

  async update(id: string, dto: UpdateSubscriptionDto): Promise<Subscription> {
    await this.subscriptionRepository.update(id, dto);
    return this.findOne(id);
  }

  async createCheckout(
    userId: string,
    planType: PlanType,
  ): Promise<CheckoutResult> {
    if (planType === PlanType.FREE) {
      throw new BadRequestException('FREE plan does not require payment');
    }

    const plan = PLAN_CONFIGS[planType];
    const orderId = `sub_${userId}_${planType}_${uuidv4()}`;

    const { data, signature } = this.liqPayService.createCheckoutParams({
      orderId,
      amount: plan.price,
      currency: plan.currency,
      description: `Subscription ${plan.name} - ${plan.price} UAH/month`,
      action: 'subscribe',
      subscribePeriodicity: 'month',
    });

    const checkoutUrl = `https://www.liqpay.ua/api/3/checkout?data=${data}&signature=${signature}`;

    return { data, signature, checkoutUrl };
  }

  async activateSubscription(
    userId: string,
    planType: PlanType,
    liqpayOrderId: string,
  ): Promise<Subscription> {
    let sub = await this.subscriptionRepository.findOne({ where: { userId } });

    const currentPeriodEnd = new Date();
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);

    if (sub) {
      sub.planType = planType;
      sub.status = SubscriptionStatus.ACTIVE;
      sub.currentPeriodEnd = currentPeriodEnd;
      sub.liqpayOrderId = liqpayOrderId;
    } else {
      sub = this.subscriptionRepository.create({
        userId,
        planType,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEnd,
        liqpayOrderId,
      });
    }

    const saved = await this.subscriptionRepository.save(sub);
    this.logger.log(
      `[Subscription] Activated plan "${planType}" for user ${userId}. Order ID: ${liqpayOrderId}`,
    );
    return saved;
  }

  async cancelSubscription(userId: string): Promise<Subscription> {
    const sub = await this.findByUserId(userId);

    if (sub.status === SubscriptionStatus.CANCELED) {
      throw new BadRequestException('Subscription is already cancelled.');
    }
    if (sub.planType === PlanType.FREE) {
      throw new BadRequestException('FREE plan cant be cancelled.');
    }

    sub.status = SubscriptionStatus.CANCELED;
    const saved = await this.subscriptionRepository.save(sub);
    this.logger.log(
      `[Subscription] User ${userId} cancelled their "${sub.planType}" subscription.`,
    );
    return saved;
  }

  async renewSubscription(userId: string): Promise<Subscription> {
    const sub = await this.findByUserId(userId);

    const currentPeriodEnd = new Date();
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);

    sub.status = SubscriptionStatus.ACTIVE;
    sub.currentPeriodEnd = currentPeriodEnd;

    const saved = await this.subscriptionRepository.save(sub);
    this.logger.log(
      `[Subscription] Renewed subscription for user ${userId}. New end date: ${currentPeriodEnd.toISOString()}`,
    );
    return saved;
  }

  async markExpiredAsPayDue(): Promise<void> {
    const now = new Date();
    const result = await this.subscriptionRepository
      .createQueryBuilder()
      .update(Subscription)
      .set({ status: SubscriptionStatus.PAST_DUE })
      .where('status = :status', { status: SubscriptionStatus.ACTIVE })
      .andWhere('currentPeriodEnd < :now', { now })
      .andWhere('planType != :free', { free: PlanType.FREE })
      .execute();

    if (result.affected > 0) {
      this.logger.log(
        `[Subscription Cron] Marked ${result.affected} active subscriptions as PAST_DUE (payment overdue)`,
      );
    }
  }

  async expirePastDueSubscriptions(): Promise<void> {
    const gracePeriodDeadline = new Date();
    gracePeriodDeadline.setDate(gracePeriodDeadline.getDate() - 1);

    const result = await this.subscriptionRepository
      .createQueryBuilder()
      .update(Subscription)
      .set({ status: SubscriptionStatus.EXPIRED, planType: PlanType.FREE })
      .where('status = :status', { status: SubscriptionStatus.PAST_DUE })
      .andWhere('currentPeriodEnd < :deadline', {
        deadline: gracePeriodDeadline,
      })
      .execute();

    if (result.affected > 0) {
      this.logger.warn(
        `[Subscription Cron] EXPIRED ${result.affected} past-due subscriptions (grace period ended). Users reverted to FREE plan.`,
      );
    }
  }
}
