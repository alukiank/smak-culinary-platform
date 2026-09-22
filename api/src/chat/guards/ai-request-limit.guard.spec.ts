import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AiRequestLimitGuard } from './ai-request-limit.guard';
import { AiRequestLimitService } from '../services/ai-request-limit.service';
import { SubscriptionService } from '../../billing/services/subscription.service';
import { PlanType } from '../../billing/enums/subscription-plan.enum';

function createMockContext(userId: string): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        user: { id: userId },
      }),
      getResponse: () => ({}),
      getNext: () => ({}),
    }),
    getHandler: () => jest.fn(),
    getClass: () => jest.fn(),
  } as unknown as ExecutionContext;
}

describe('AiRequestLimitGuard', () => {
  let guard: AiRequestLimitGuard;
  let aiLimitService: { getDailyMessageCount: jest.Mock };
  let subscriptionService: { getUserPlanType: jest.Mock };

  beforeEach(async () => {
    aiLimitService = {
      getDailyMessageCount: jest.fn(),
    };

    subscriptionService = {
      getUserPlanType: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiRequestLimitGuard,
        { provide: AiRequestLimitService, useValue: aiLimitService },
        { provide: SubscriptionService, useValue: subscriptionService },
      ],
    }).compile();

    guard = module.get<AiRequestLimitGuard>(AiRequestLimitGuard);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should allow request for FREE user within limit (e.g. 5 of 10 requests)', async () => {
    subscriptionService.getUserPlanType.mockResolvedValue(PlanType.FREE);
    aiLimitService.getDailyMessageCount.mockResolvedValue(5);

    const context = createMockContext('usr-free');
    const result = await guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should throw ForbiddenException when FREE user reaches daily limit (10 requests)', async () => {
    subscriptionService.getUserPlanType.mockResolvedValue(PlanType.FREE);
    aiLimitService.getDailyMessageCount.mockResolvedValue(10);

    const context = createMockContext('usr-free');

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('should allow request for PRO user with higher limit (e.g. 25 of 50 requests)', async () => {
    subscriptionService.getUserPlanType.mockResolvedValue(PlanType.PRO);
    aiLimitService.getDailyMessageCount.mockResolvedValue(25);

    const context = createMockContext('usr-pro');
    const result = await guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should always allow request for PREMIUM user with unlimited quota (Infinity)', async () => {
    subscriptionService.getUserPlanType.mockResolvedValue(PlanType.PREMIUM);
    aiLimitService.getDailyMessageCount.mockResolvedValue(9999);

    const context = createMockContext('usr-premium');
    const result = await guard.canActivate(context);

    expect(result).toBe(true);
  });
});
