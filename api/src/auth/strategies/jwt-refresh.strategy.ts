import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy } from 'passport-jwt';
import { UserService } from '../../user/user.service';
import { AuthCacheService } from '../../auth/services/auth-cache.service';
import { plainToInstance } from 'class-transformer';
import { UserPrivateDto } from '../../user/dto/user-private.dto';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly authCacheService: AuthCacheService,
  ) {
    super({
      jwtFromRequest: (req: Request) => {
        return req.cookies?.['refreshToken'] || null;
      },
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_REFRESH_SECRET'),
    });
  }

  async validate(payload: { id: string }): Promise<UserPrivateDto> {
    const cachedUser = await this.authCacheService.findSession(payload.id);

    if (cachedUser) {
      return cachedUser;
    }

    const user = await this.userService.findOne({ id: payload.id });
    if (!user) throw new UnauthorizedException();

    await this.authCacheService.createSession(user);

    return plainToInstance(UserPrivateDto, user, {
      excludeExtraneousValues: true,
    });
  }
}
