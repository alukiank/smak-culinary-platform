import { Test, TestingModule } from '@nestjs/testing';
import { AiRequestLimitService } from './ai-request-limit.service';
import { RedisService } from '../../infrastructure/redis/redis.service';

describe('AiRequestLimitService', () => {
  let service: AiRequestLimitService;
  let redisService: {
    get: jest.Mock;
    incr: jest.Mock;
  };

  beforeEach(async () => {
    redisService = {
      get: jest.fn(),
      incr: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiRequestLimitService,
        { provide: RedisService, useValue: redisService },
      ],
    }).compile();

    service = module.get<AiRequestLimitService>(AiRequestLimitService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 0 when no requests have been made today', async () => {
    redisService.get.mockResolvedValue(null);

    const count = await service.getDailyMessageCount('usr-1');

    expect(count).toBe(0);
    expect(redisService.get).toHaveBeenCalledWith(
      expect.stringMatching(/^ai-requests:usr-1:\d{4}-\d{2}-\d{2}$/),
    );
  });

  it('should return parsed count when key exists in Redis', async () => {
    redisService.get.mockResolvedValue('7');

    const count = await service.getDailyMessageCount('usr-1');

    expect(count).toBe(7);
  });

  it('should increment count with 24 hours TTL (86400 seconds)', async () => {
    redisService.incr.mockResolvedValue(8);

    const newCount = await service.incrementDailyMessageCount('usr-1');

    expect(redisService.incr).toHaveBeenCalledWith(
      expect.stringMatching(/^ai-requests:usr-1:\d{4}-\d{2}-\d{2}$/),
      86400,
    );
    expect(newCount).toBe(8);
  });
});
