import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { TokenService } from './token.service';

describe('TokenService', () => {
  let service: TokenService;
  let jwtService: { signAsync: jest.Mock };
  let configService: { get: jest.Mock };
  let mockResponse: Partial<Response>;

  beforeEach(async () => {
    jwtService = {
      signAsync: jest.fn(),
    };

    configService = {
      get: jest.fn((key: string) => {
        const config: Record<string, string> = {
          JWT_ACCESS_SECRET: 'access-secret-123',
          JWT_ACCESS_EXPIRATION: '15m',
          JWT_REFRESH_SECRET: 'refresh-secret-456',
          JWT_REFRESH_EXPIRATION: '7d',
          NODE_ENV: 'test',
          COOKIE_DOMAIN: '',
          COOKIE_SAMESITE: 'lax',
        };
        return config[key];
      }),
    };

    mockResponse = {
      cookie: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<TokenService>(TokenService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateAndSetTokens', () => {
    it('should generate access and refresh tokens and set them in cookies', async () => {
      jwtService.signAsync
        .mockResolvedValueOnce('mock-access-token')
        .mockResolvedValueOnce('mock-refresh-token');

      const userId = 'user-123';
      const result = await service.generateAndSetTokens(
        userId,
        mockResponse as Response,
      );

      expect(result).toEqual({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      });

      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(jwtService.signAsync).toHaveBeenNthCalledWith(
        1,
        { id: userId },
        { secret: 'access-secret-123', expiresIn: '15m' },
      );
      expect(jwtService.signAsync).toHaveBeenNthCalledWith(
        2,
        { id: userId },
        { secret: 'refresh-secret-456', expiresIn: '7d' },
      );

      expect(mockResponse.cookie).toHaveBeenCalledTimes(2);
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'accessToken',
        'mock-access-token',
        expect.objectContaining({
          httpOnly: true,
          secure: false, // test env
          sameSite: 'lax',
          maxAge: 15 * 60 * 1000,
        }),
      );
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'mock-refresh-token',
        expect.objectContaining({
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000,
        }),
      );
    });

    it('should set secure flag in production environment and include cookieDomain when configured', async () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'NODE_ENV') return 'production';
        if (key === 'COOKIE_DOMAIN') return 'smak.ua';
        if (key === 'COOKIE_SAMESITE') return 'strict';
        if (key === 'JWT_ACCESS_SECRET') return 'secret';
        if (key === 'JWT_ACCESS_EXPIRATION') return '1h';
        if (key === 'JWT_REFRESH_SECRET') return 'secret';
        if (key === 'JWT_REFRESH_EXPIRATION') return '30d';
        return undefined;
      });

      jwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      await service.generateAndSetTokens('user-id', mockResponse as Response);

      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'accessToken',
        'access-token',
        expect.objectContaining({
          httpOnly: true,
          secure: true,
          domain: 'smak.ua',
          sameSite: 'strict',
          maxAge: 60 * 60 * 1000,
        }),
      );
    });

    it('should default sameSite to lax and omit domain when COOKIE_DOMAIN is empty', async () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'NODE_ENV') return 'development';
        if (key === 'COOKIE_DOMAIN') return undefined;
        if (key === 'COOKIE_SAMESITE') return undefined;
        if (key === 'JWT_ACCESS_EXPIRATION') return 'invalid_format';
        return 'test-secret';
      });

      jwtService.signAsync.mockResolvedValue('token');

      await service.generateAndSetTokens('usr-1', mockResponse as Response);

      const cookieCall = (mockResponse.cookie as jest.Mock).mock.calls[0];
      const cookieOptions = cookieCall[2];

      expect(cookieOptions.sameSite).toBe('lax');
      expect(cookieOptions.secure).toBe(false);
      expect(cookieOptions.domain).toBeUndefined();
      expect(cookieOptions.maxAge).toBe(0); // parseTimeToMs fallback for invalid format
    });
  });

  describe('clearTokens', () => {
    it('should set expired cookies for accessToken and refreshToken', () => {
      service.clearTokens(mockResponse as Response);

      expect(mockResponse.cookie).toHaveBeenCalledTimes(2);
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refreshToken',
        '',
        expect.objectContaining({
          httpOnly: true,
          maxAge: 0,
        }),
      );
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'accessToken',
        '',
        expect.objectContaining({
          httpOnly: true,
          maxAge: 0,
        }),
      );
    });
  });
});
