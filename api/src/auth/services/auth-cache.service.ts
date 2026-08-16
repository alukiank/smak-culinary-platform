import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '../../user/entities/user.entity';
import { parseTimeToMs } from '../../shared/methods/parse-time-to-seconds';
import { plainToInstance } from 'class-transformer';
import { UserPrivateDto } from '../../user/dto/user-private.dto';
import { RedisService } from '../../infrastructure/redis/redis.service';
import {
  REDIS_PREFIXES,
  REDIS_TTL,
} from '../../infrastructure/redis/redis.constants';
import * as crypto from 'crypto';

@Injectable()
export class AuthCacheService {
  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  async createSession(user: User) {
    const key = `${REDIS_PREFIXES.SESSION}:${user.id}`;

    const sessionData = plainToInstance(UserPrivateDto, user, {
      excludeExtraneousValues: true,
    });

    const ttl = this.calculateTtl();
    await this.redisService.set(key, JSON.stringify(sessionData), ttl);
  }

  async updateSession(user: User) {
    await this.createSession(user);
  }

  async deleteSession(userId: string) {
    await this.redisService.del(`${REDIS_PREFIXES.SESSION}:${userId}`);
  }

  async invalidateUserSession(userId: string) {
    await this.redisService.del(`${REDIS_PREFIXES.SESSION}:${userId}`);
  }

  async findSession(id: string): Promise<UserPrivateDto | null> {
    const cacheKey = `${REDIS_PREFIXES.SESSION}:${id}`;
    const cached = await this.redisService.get(cacheKey);

    if (cached) {
      return JSON.parse(cached) as UserPrivateDto;
    }
    return null;
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async createVerificationToken(userId: string, token: string) {
    const hashedToken = this.hashToken(token);
    const key = `${REDIS_PREFIXES.VERIFY_EMAIL}:${hashedToken}`;
    await this.redisService.set(key, userId, REDIS_TTL.VERIFY_EMAIL_SECONDS);
  }

  async getUserIdByVerificationToken(token: string): Promise<string | null> {
    const hashedToken = this.hashToken(token);
    return await this.redisService.get(
      `${REDIS_PREFIXES.VERIFY_EMAIL}:${hashedToken}`,
    );
  }

  async createResetToken(userId: string, token: string) {
    const hashedToken = this.hashToken(token);
    const key = `${REDIS_PREFIXES.RESET_PASSWORD}:${hashedToken}`;
    await this.redisService.set(key, userId, REDIS_TTL.RESET_PASSWORD_SECONDS);
  }

  async getUserIdByResetToken(token: string): Promise<string | null> {
    const hashedToken = this.hashToken(token);
    return await this.redisService.get(
      `${REDIS_PREFIXES.RESET_PASSWORD}:${hashedToken}`,
    );
  }

  async deleteToken(prefix: 'verify-email' | 'reset-password', token: string) {
    const hashedToken = this.hashToken(token);
    await this.redisService.del(`${REDIS_PREFIXES[prefix]}:${hashedToken}`);
  }

  private calculateTtl(): number {
    const expiry = this.configService.get<string>('JWT_ACCESS_EXPIRATION');
    const ttlInSeconds = Math.floor(parseTimeToMs(expiry) / 1000);
    return ttlInSeconds + REDIS_TTL.SESSION_BUFFER_SECONDS;
  }
}
