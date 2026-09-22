import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AuthCacheService } from './auth-cache.service';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { User } from '../../user/entities/user.entity';
import { UserRoleEnum } from '../../user/enums/user-role.enum';
import { REDIS_PREFIXES, REDIS_TTL } from '../../infrastructure/redis/redis.constants';
import * as crypto from 'crypto';

describe('AuthCacheService', () => {
  let service: AuthCacheService;
  let redisService: {
    set: jest.Mock;
    get: jest.Mock;
    del: jest.Mock;
  };
  let configService: { get: jest.Mock };

  beforeEach(async () => {
    redisService = {
      set: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
    };

    configService = {
      get: jest.fn((key: string) => {
        if (key === 'JWT_ACCESS_EXPIRATION') return '15m';
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthCacheService,
        { provide: RedisService, useValue: redisService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<AuthCacheService>(AuthCacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Sessions', () => {
    const mockUser = {
      id: 'usr-1',
      username: 'chef_john',
      displayname: 'John Doe',
      email: 'john@smak.ua',
      role: UserRoleEnum.USER,
      isVerified: true,
      isBanned: false,
      dietary: [],
      allergies: [],
      bio: null,
      avatarId: null,
      passwordHash: 'secret_hash',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as User;

    it('should create user session with calculated TTL including buffer', async () => {
      await service.createSession(mockUser);

      const expectedKey = `${REDIS_PREFIXES.SESSION}:${mockUser.id}`;
      // 15m = 900s + SESSION_BUFFER_SECONDS (e.g. 60s)
      const expectedTtl = 900 + REDIS_TTL.SESSION_BUFFER_SECONDS;

      expect(redisService.set).toHaveBeenCalledWith(
        expectedKey,
        expect.any(String),
        expectedTtl,
      );

      const savedData = JSON.parse(redisService.set.mock.calls[0][1]);
      expect(savedData.id).toBe(mockUser.id);
      expect(savedData.email).toBe(mockUser.email);
      expect(savedData.passwordHash).toBeUndefined(); // Excluded from UserPrivateDto
    });

    it('should find cached session and parse UserPrivateDto', async () => {
      const cachedSession = {
        id: 'usr-1',
        email: 'john@smak.ua',
        role: UserRoleEnum.USER,
      };
      redisService.get.mockResolvedValue(JSON.stringify(cachedSession));

      const result = await service.findSession('usr-1');

      expect(redisService.get).toHaveBeenCalledWith(`${REDIS_PREFIXES.SESSION}:usr-1`);
      expect(result).toEqual(cachedSession);
    });

    it('should return null when session is not in cache', async () => {
      redisService.get.mockResolvedValue(null);

      const result = await service.findSession('unknown-id');

      expect(result).toBeNull();
    });

    it('should delete and invalidate session in redis', async () => {
      await service.invalidateUserSession('usr-1');

      expect(redisService.del).toHaveBeenCalledWith(`${REDIS_PREFIXES.SESSION}:usr-1`);
    });
  });

  describe('Tokens (Verification & Password Reset)', () => {
    const rawToken = 'raw-secure-random-token-xyz';
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    it('should store hashed verification token in Redis', async () => {
      await service.createVerificationToken('user-1', rawToken);

      expect(redisService.set).toHaveBeenCalledWith(
        `${REDIS_PREFIXES.VERIFY_EMAIL}:${hashedToken}`,
        'user-1',
        REDIS_TTL.VERIFY_EMAIL_SECONDS,
      );
    });

    it('should retrieve userId by raw verification token', async () => {
      redisService.get.mockResolvedValue('user-1');

      const result = await service.getUserIdByVerificationToken(rawToken);

      expect(redisService.get).toHaveBeenCalledWith(
        `${REDIS_PREFIXES.VERIFY_EMAIL}:${hashedToken}`,
      );
      expect(result).toBe('user-1');
    });

    it('should store hashed reset token in Redis', async () => {
      await service.createResetToken('user-2', rawToken);

      expect(redisService.set).toHaveBeenCalledWith(
        `${REDIS_PREFIXES.RESET_PASSWORD}:${hashedToken}`,
        'user-2',
        REDIS_TTL.RESET_PASSWORD_SECONDS,
      );
    });

    it('should delete token using its hash', async () => {
      await service.deleteToken('verify-email', rawToken);

      expect(redisService.del).toHaveBeenCalledWith(
        `${REDIS_PREFIXES['verify-email']}:${hashedToken}`,
      );
    });
  });
});
