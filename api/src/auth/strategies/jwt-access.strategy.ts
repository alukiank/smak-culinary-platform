import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../../user/user.service';
import { Request } from 'express';
import { AuthCacheService } from '../../auth/services/auth-cache.service';
import { plainToInstance } from 'class-transformer';
import { UserPrivateDto } from '../../user/dto/user-private.dto';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { REDIS_PREFIXES } from '../../infrastructure/redis/redis.constants';

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(
  Strategy,
  'jwt-access',
) {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly authCacheService: AuthCacheService,
    private readonly redisService: RedisService,
  ) {
    super({
      jwtFromRequest: (req: Request) => {
        return req.cookies?.['accessToken'] || null;
      },
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: { id: string }): Promise<UserPrivateDto> {
    const cacheKey = `${REDIS_PREFIXES.SESSION}:${payload.id}`;
    const cachedUser = await this.redisService.get(cacheKey);

    if (cachedUser) {
      const user = JSON.parse(cachedUser) as UserPrivateDto;
      return user;
    }

    const user = await this.userService.findOne({ id: payload.id });
    if (!user) {
      throw new UnauthorizedException();
    }

    await this.authCacheService.createSession(user);

    return plainToInstance(UserPrivateDto, user, {
      excludeExtraneousValues: true,
    });
  }
}
