import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionExpiryTask } from './subscription-expiry.task';
import { SubscriptionService } from '../services/subscription.service';

describe('SubscriptionExpiryTask', () => {
  let task: SubscriptionExpiryTask;
  let subscriptionService: {
    markExpiredAsPayDue: jest.Mock;
    expirePastDueSubscriptions: jest.Mock;
  };

  beforeEach(async () => {
    subscriptionService = {
      markExpiredAsPayDue: jest.fn().mockResolvedValue(undefined),
      expirePastDueSubscriptions: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionExpiryTask,
        { provide: SubscriptionService, useValue: subscriptionService },
      ],
    }).compile();

    task = module.get<SubscriptionExpiryTask>(SubscriptionExpiryTask);
  });

  it('should run markExpiredAsPayDue and expirePastDueSubscriptions', async () => {
    await task.handleSubscriptionExpiry();

    expect(subscriptionService.markExpiredAsPayDue).toHaveBeenCalledTimes(1);
    expect(subscriptionService.expirePastDueSubscriptions).toHaveBeenCalledTimes(1);
  });

  it('should catch errors gracefully without throwing', async () => {
    subscriptionService.markExpiredAsPayDue.mockRejectedValue(new Error('Database lock error'));

    await expect(task.handleSubscriptionExpiry()).resolves.not.toThrow();
  });
});
