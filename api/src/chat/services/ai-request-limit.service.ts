import { Injectable } from '@nestjs/common';
import { RedisService } from '../../infrastructure/redis/redis.service';

@Injectable()
export class AiRequestLimitService {
  constructor(private readonly redisService: RedisService) {}

  private getDailyLimitKey(userId: string): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return `ai-requests:${userId}:${dateStr}`;
  }

  async getDailyMessageCount(userId: string): Promise<number> {
    const key = this.getDailyLimitKey(userId);
    const countStr = await this.redisService.get(key);
    return countStr ? parseInt(countStr, 10) : 0;
  }

  async incrementDailyMessageCount(userId: string): Promise<number> {
    const key = this.getDailyLimitKey(userId);
    return this.redisService.incr(key, 86400); // 24 hours TTL
  }
}
