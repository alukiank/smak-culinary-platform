import { Inject, Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService {
  constructor(@Inject('REDIS_CLIENT') private readonly redisClient: Redis) {}

  async get(key: string): Promise<string | null> {
    return this.redisClient.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.redisClient.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.redisClient.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.redisClient.del(key);
  }

  async incr(key: string, ttlSeconds?: number): Promise<number> {
    const val = await this.redisClient.incr(key);
    if (val === 1 && ttlSeconds) {
      await this.redisClient.expire(key, ttlSeconds);
    }
    return val;
  }

  async delByPattern(pattern: string): Promise<void> {
    const stream = this.redisClient.scanStream({
      match: pattern,
      count: 100,
    });

    return new Promise((resolve, reject) => {
      stream.on('data', async (keys: string[]) => {
        if (keys.length > 0) {
          stream.pause();
          const pipeline = this.redisClient.pipeline();
          keys.forEach((key) => pipeline.del(key));
          await pipeline.exec();
          stream.resume();
        }
      });

      stream.on('end', () => resolve());
      stream.on('error', (err) => reject(err));
    });
  }
}
