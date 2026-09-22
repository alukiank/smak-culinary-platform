import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { SubscriptionService } from './subscription.service';
import { Subscription } from '../entities/subscription.entity';
import { LiqPayService } from '../../infrastructure/liqpay/liqpay.service';
import { PlanType } from '../enums/subscription-plan.enum';
import { SubscriptionStatus } from '../enums/subscription-status.enum';

describe('SubscriptionService', () => {
  let service: SubscriptionService;
  let repo: jest.Mocked<Repository<Subscription>>;
  let liqPayService: {
    createCheckoutParams: jest.Mock;
    unsubscribe: jest.Mock;
  };
  let configService: { get: jest.Mock };
  let mockQueryBuilder: any;

  beforeEach(async () => {
    mockQueryBuilder = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    const mockRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      findAndCount: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    liqPayService = {
      createCheckoutParams: jest.fn(),
      unsubscribe: jest.fn().mockResolvedValue({ result: 'ok' }),
    };

    configService = {
      get: jest.fn((key: string) => {
        if (key === 'FRONTEND_URL') return 'https://smak.ua';
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionService,
        { provide: getRepositoryToken(Subscription), useValue: mockRepo },
        { provide: LiqPayService, useValue: liqPayService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<SubscriptionService>(SubscriptionService);
    repo = module.get(getRepositoryToken(Subscription));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createCheckout', () => {
    it('should throw BadRequestException if planType is FREE', async () => {
      await expect(service.createCheckout('usr-1', PlanType.FREE)).rejects.toThrow(
        new BadRequestException('FREE plan does not require payment'),
      );
    });

    it('should call LiqPayService to create checkout params and return checkout URL', async () => {
      liqPayService.createCheckoutParams.mockReturnValue({
        data: 'mock-data',
        signature: 'mock-sig',
      });

      const result = await service.createCheckout('usr-1', PlanType.PRO);

      expect(liqPayService.createCheckoutParams).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'subscribe',
          subscribePeriodicity: 'month',
          amount: 149,
          currency: 'UAH',
        }),
      );
      expect(result).toEqual({
        data: 'mock-data',
        signature: 'mock-sig',
        checkoutUrl: 'https://www.liqpay.ua/api/3/checkout?data=mock-data&signature=mock-sig',
      });
    });
  });

  describe('activateSubscription', () => {
    it('should create and activate new subscription when none exists', async () => {
      repo.findOne.mockResolvedValue(null);

      const createdSub = {
        userId: 'usr-1',
        planType: PlanType.PRO,
        status: SubscriptionStatus.ACTIVE,
        liqpayOrderId: 'order-1',
        currentPeriodEnd: expect.any(Date),
      } as Subscription;

      repo.create.mockReturnValue(createdSub);
      repo.save.mockImplementation(async (sub) => sub as Subscription);

      const result = await service.activateSubscription('usr-1', PlanType.PRO, 'order-1');

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'usr-1',
          planType: PlanType.PRO,
          status: SubscriptionStatus.ACTIVE,
          liqpayOrderId: 'order-1',
        }),
      );
      expect(result.status).toBe(SubscriptionStatus.ACTIVE);
      expect(result.planType).toBe(PlanType.PRO);
    });

    it('should unsubscribe previous LiqPay order if orderId changed during upgrade', async () => {
      const existingSub = {
        id: 'sub-1',
        userId: 'usr-1',
        planType: PlanType.PREMIUM,
        status: SubscriptionStatus.ACTIVE,
        liqpayOrderId: 'old-order-123',
      } as Subscription;

      repo.findOne.mockResolvedValue(existingSub);
      repo.save.mockImplementation(async (sub) => sub as Subscription);

      await service.activateSubscription('usr-1', PlanType.PRO, 'new-order-456');

      expect(liqPayService.unsubscribe).toHaveBeenCalledWith('old-order-123');
      expect(existingSub.planType).toBe(PlanType.PRO);
      expect(existingSub.liqpayOrderId).toBe('new-order-456');
    });
  });

  describe('cancelSubscription', () => {
    it('should throw BadRequestException if subscription is already cancelled', async () => {
      repo.findOne.mockResolvedValue({
        id: 'sub-1',
        userId: 'usr-1',
        status: SubscriptionStatus.CANCELED,
      } as Subscription);

      await expect(service.cancelSubscription('usr-1')).rejects.toThrow(
        new BadRequestException('Subscription is already cancelled.'),
      );
    });

    it('should throw BadRequestException if planType is FREE', async () => {
      repo.findOne.mockResolvedValue({
        id: 'sub-1',
        userId: 'usr-1',
        planType: PlanType.FREE,
        status: SubscriptionStatus.ACTIVE,
      } as Subscription);

      await expect(service.cancelSubscription('usr-1')).rejects.toThrow(
        new BadRequestException('FREE plan cant be cancelled.'),
      );
    });

    it('should cancel subscription in LiqPay and mark status as CANCELED', async () => {
      const activeSub = {
        id: 'sub-1',
        userId: 'usr-1',
        planType: PlanType.PRO,
        status: SubscriptionStatus.ACTIVE,
        liqpayOrderId: 'liqpay-sub-1',
      } as Subscription;

      repo.findOne.mockResolvedValue(activeSub);
      repo.save.mockImplementation(async (sub) => sub as Subscription);

      const result = await service.cancelSubscription('usr-1');

      expect(liqPayService.unsubscribe).toHaveBeenCalledWith('liqpay-sub-1');
      expect(result.status).toBe(SubscriptionStatus.CANCELED);
    });
  });

  describe('renewSubscription', () => {
    it('should extend currentPeriodEnd by 1 month and keep ACTIVE', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      const existingSub = {
        id: 'sub-1',
        userId: 'usr-1',
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEnd: futureDate,
      } as Subscription;

      repo.findOne.mockResolvedValue(existingSub);
      repo.save.mockImplementation(async (sub) => sub as Subscription);

      const result = await service.renewSubscription('usr-1');

      expect(result.status).toBe(SubscriptionStatus.ACTIVE);
      expect(new Date(result.currentPeriodEnd).getTime()).toBeGreaterThan(futureDate.getTime());
    });
  });

  describe('getUserPlanType', () => {
    it('should return FREE if user has no subscription record', async () => {
      repo.findOne.mockResolvedValue(null);

      const plan = await service.getUserPlanType('usr-1');
      expect(plan).toBe(PlanType.FREE);
    });

    it('should return active plan type', async () => {
      repo.findOne.mockResolvedValue({
        userId: 'usr-1',
        status: SubscriptionStatus.ACTIVE,
        planType: PlanType.PRO,
      } as Subscription);

      const plan = await service.getUserPlanType('usr-1');
      expect(plan).toBe(PlanType.PRO);
    });

    it('should return plan type if cancelled but period end is still in the future', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);

      repo.findOne.mockResolvedValue({
        userId: 'usr-1',
        status: SubscriptionStatus.CANCELED,
        planType: PlanType.PRO,
        currentPeriodEnd: futureDate,
      } as Subscription);

      const plan = await service.getUserPlanType('usr-1');
      expect(plan).toBe(PlanType.PRO);
    });

    it('should return FREE if cancelled and period has ended', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);

      repo.findOne.mockResolvedValue({
        userId: 'usr-1',
        status: SubscriptionStatus.CANCELED,
        planType: PlanType.PRO,
        currentPeriodEnd: pastDate,
      } as Subscription);

      const plan = await service.getUserPlanType('usr-1');
      expect(plan).toBe(PlanType.FREE);
    });
  });

  describe('handleReversedPayment', () => {
    it('should revert subscription to FREE and CANCELED, and unsubscribe from LiqPay', async () => {
      const activeSub = {
        userId: 'usr-1',
        liqpayOrderId: 'order-123',
        status: SubscriptionStatus.ACTIVE,
        planType: PlanType.PRO,
      } as Subscription;

      repo.findOne.mockResolvedValue(activeSub);
      repo.save.mockImplementation(async (sub) => sub as Subscription);

      const result = await service.handleReversedPayment('usr-1', 'order-123');

      expect(liqPayService.unsubscribe).toHaveBeenCalledWith('order-123');
      expect(result.status).toBe(SubscriptionStatus.CANCELED);
      expect(result.planType).toBe(PlanType.FREE);
    });
  });

  describe('Cron updates: markExpiredAsPayDue & expirePastDueSubscriptions', () => {
    it('should mark active subscriptions past period end as PAST_DUE with strict WHERE filters', async () => {
      await service.markExpiredAsPayDue();

      expect(repo.createQueryBuilder).toHaveBeenCalled();
      expect(mockQueryBuilder.update).toHaveBeenCalledWith(Subscription);
      expect(mockQueryBuilder.set).toHaveBeenCalledWith({
        status: SubscriptionStatus.PAST_DUE,
      });
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'status = :status',
        { status: SubscriptionStatus.ACTIVE },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'currentPeriodEnd < :now',
        expect.objectContaining({ now: expect.any(Date) }),
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'planType != :free',
        { free: PlanType.FREE },
      );
      expect(mockQueryBuilder.execute).toHaveBeenCalled();
    });

    it('should expire past due subscriptions after grace period and revert to FREE with strict WHERE filters', async () => {
      await service.expirePastDueSubscriptions();

      expect(mockQueryBuilder.update).toHaveBeenCalledWith(Subscription);
      expect(mockQueryBuilder.set).toHaveBeenCalledWith({
        status: SubscriptionStatus.EXPIRED,
        planType: PlanType.FREE,
      });
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'status = :status',
        { status: SubscriptionStatus.PAST_DUE },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'currentPeriodEnd < :deadline',
        expect.objectContaining({ deadline: expect.any(Date) }),
      );
      expect(mockQueryBuilder.execute).toHaveBeenCalled();
    });
  });
});
