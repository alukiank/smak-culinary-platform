import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { parseTimeToMs } from '../../shared/methods/parse-time-to-seconds';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async generateAndSetTokens(
    id: string,
    res: Response,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = await this.jwtService.signAsync(
      { id },
      {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get<string>(
          'JWT_ACCESS_EXPIRATION',
        ) as any,
      },
    );

    const refreshToken = await this.jwtService.signAsync(
      { id },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>(
          'JWT_REFRESH_EXPIRATION',
        ) as any,
      },
    );

    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';
    const cookieDomain = this.configService.get<string>('COOKIE_DOMAIN');
    const sameSiteMode =
      (this.configService.get<string>('COOKIE_SAMESITE') as
        | 'lax'
        | 'strict'
        | 'none') || 'lax';

    const baseOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: sameSiteMode,
      ...(cookieDomain ? { domain: cookieDomain } : {}),
    };

    res.cookie('accessToken', accessToken, {
      ...baseOptions,
      maxAge: parseTimeToMs(
        this.configService.get<string>('JWT_ACCESS_EXPIRATION'),
      ),
    });

    res.cookie('refreshToken', refreshToken, {
      ...baseOptions,
      maxAge: parseTimeToMs(
        this.configService.get<string>('JWT_REFRESH_EXPIRATION'),
      ),
    });

    return { accessToken, refreshToken };
  }

  clearTokens(res: Response): void {
    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';
    const cookieDomain = this.configService.get<string>('COOKIE_DOMAIN');
    const sameSiteMode =
      (this.configService.get<string>('COOKIE_SAMESITE') as
        | 'lax'
        | 'strict'
        | 'none') || 'lax';

    const baseOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: sameSiteMode,
      ...(cookieDomain ? { domain: cookieDomain } : {}),
    };

    res.cookie('refreshToken', '', {
      ...baseOptions,
      maxAge: 0,
    });
    res.cookie('accessToken', '', {
      ...baseOptions,
      maxAge: 0,
    });
  }
}
