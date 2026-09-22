import { Test, TestingModule } from '@nestjs/testing';
import { UserRegisteredListener } from './user-registered.listener';
import { SubscriptionService } from '../services/subscription.service';
import { PlanType } from '../enums/subscription-plan.enum';

describe('UserRegisteredListener', () => {
  let listener: UserRegisteredListener;
  let subscriptionService: { activateSubscription: jest.Mock };

  beforeEach(async () => {
    subscriptionService = {
      activateSubscription: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRegisteredListener,
        { provide: SubscriptionService, useValue: subscriptionService },
      ],
    }).compile();

    listener = module.get<UserRegisteredListener>(UserRegisteredListener);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should activate FREE subscription for newly registered user', async () => {
    subscriptionService.activateSubscription.mockResolvedValue({ id: 'sub-1' });

    await listener.handleUserCreated({ userId: 'usr-new-1' });

    expect(subscriptionService.activateSubscription).toHaveBeenCalledWith(
      'usr-new-1',
      PlanType.FREE,
      null,
    );
  });

  it('should catch and isolate errors if subscription activation fails, preventing registration failure', async () => {
    subscriptionService.activateSubscription.mockRejectedValue(
      new Error('Billing database connection timeout'),
    );

    // Must resolve safely without throwing exception to calling thread
    await expect(
      listener.handleUserCreated({ userId: 'usr-failing-sub' }),
    ).resolves.not.toThrow();

    expect(subscriptionService.activateSubscription).toHaveBeenCalledWith(
      'usr-failing-sub',
      PlanType.FREE,
      null,
    );
  });
});
