import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/services/auth.service';
import { VerificationService } from '../src/auth/services/verification.service';
import { TokenService } from '../src/auth/services/token.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  const mockAuthService = {
    signup: jest.fn(),
    login: jest.fn(),
    me: jest.fn(),
  };

  const mockVerificationService = {
    verifyEmail: jest.fn(),
    resendVerificationEmail: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        JWT_ACCESS_SECRET: 'test-access-secret-12345678901234567890',
        JWT_REFRESH_SECRET: 'test-refresh-secret-12345678901234567890',
        JWT_ACCESS_EXPIRATION: '15m',
        JWT_REFRESH_EXPIRATION: '7d',
        COOKIE_SAMESITE: 'lax',
        NODE_ENV: 'test',
      };
      return config[key];
    }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: VerificationService, useValue: mockVerificationService },
        { provide: ConfigService, useValue: mockConfigService },
        TokenService,
        JwtService,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/signup', () => {
    it('should reject registration when validation fails (invalid email format, short password)', async () => {
      const invalidPayload = {
        email: 'not-an-email',
        username: 'ab', // too short
        password: '123', // does not meet complexity requirements
      };

      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(invalidPayload)
        .expect(400);

      expect(response.body.message).toBeDefined();
      expect(Array.isArray(response.body.message)).toBe(true);
      expect(mockAuthService.signup).not.toHaveBeenCalled();
    });

    it('should reject registration when unknown non-whitelisted fields are provided', async () => {
      const forbiddenPayload = {
        email: 'chef@example.com',
        username: 'validuser',
        password: 'Password123!@#',
        role: 'ADMIN', // non-whitelisted field
      };

      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(forbiddenPayload)
        .expect(400);

      expect(response.body.message).toEqual(
        expect.arrayContaining([expect.stringContaining('property role should not exist')]),
      );
      expect(mockAuthService.signup).not.toHaveBeenCalled();
    });

    it('should return 409 Conflict if email or username already exists', async () => {
      mockAuthService.signup.mockRejectedValueOnce(
        new ConflictException('User with this email already exists'),
      );

      const validPayload = {
        email: 'duplicate@example.com',
        username: 'existinguser',
        displayname: 'Existing User',
        password: 'Password123!@#',
      };

      await request(app.getHttpServer())
        .post('/auth/signup')
        .send(validPayload)
        .expect(409);
    });

    it('should successfully register user, return tokens and set HTTP-only cookies', async () => {
      mockAuthService.signup.mockImplementation(async (dto, res) => {
        const tokenService = app.get(TokenService);
        return await tokenService.generateAndSetTokens('new-user-id', res);
      });

      const validPayload = {
        email: 'newchef@example.com',
        username: 'validchef123',
        displayname: 'Valid Chef',
        password: 'Password123!@#',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(validPayload)
        .expect(201);

      // Body contains tokens
      expect(response.body.accessToken).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();

      // Cookies are set
      const cookies = (response.headers['set-cookie'] || []) as string[];
      expect(cookies).toBeDefined();
      expect(cookies.some((c: string) => c.startsWith('accessToken='))).toBe(true);
      expect(cookies.some((c: string) => c.startsWith('refreshToken='))).toBe(true);
      expect(cookies.some((c: string) => c.includes('HttpOnly'))).toBe(true);
    });
  });

  describe('POST /auth/verify-email', () => {
    it('should return 400 if verification service throws on missing/invalid token', async () => {
      mockVerificationService.verifyEmail.mockImplementationOnce((token) => {
        if (!token) {
          throw new BadRequestException('Token is required');
        }
        return true;
      });

      await request(app.getHttpServer())
        .post('/auth/verify-email')
        .expect(400);
    });

    it('should return 201 when email verification succeeds', async () => {
      mockVerificationService.verifyEmail.mockResolvedValueOnce(true);

      const response = await request(app.getHttpServer())
        .post('/auth/verify-email?token=valid-jwt-verification-token')
        .expect(201);

      expect(response.text).toBe('true');
      expect(mockVerificationService.verifyEmail).toHaveBeenCalledWith(
        'valid-jwt-verification-token',
      );
    });
  });

  describe('POST /auth/forgot-password and /auth/reset-password', () => {
    it('should validate email format for forgot-password', async () => {
      await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'bad-email' })
        .expect(400);
    });

    it('should accept valid email for forgot-password and return 201', async () => {
      mockVerificationService.forgotPassword.mockResolvedValueOnce(true);

      const response = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'user@example.com' })
        .expect(201);

      expect(response.text).toBe('true');
    });

    it('should reject reset-password when new password does not meet criteria', async () => {
      await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({ token: 'some-token', password: 'short' })
        .expect(400);
    });

    it('should successfully reset password with valid token and strong password in body', async () => {
      mockVerificationService.resetPassword.mockResolvedValueOnce(true);

      const response = await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({
          token: 'valid-reset-token',
          password: 'NewSecurePassword123!@#',
        })
        .expect(201);

      expect(response.text).toBe('true');
      expect(mockVerificationService.resetPassword).toHaveBeenCalledWith(
        'valid-reset-token',
        'NewSecurePassword123!@#',
      );
    });
  });
});
