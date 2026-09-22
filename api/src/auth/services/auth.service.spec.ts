import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Response } from 'express';
import * as argon2 from 'argon2';
import { AuthService } from './auth.service';
import { UserService } from '../../user/user.service';
import { TokenService } from './token.service';
import { AuthCacheService } from './auth-cache.service';
import { User } from '../../user/entities/user.entity';
import { UserRoleEnum } from '../../user/enums/user-role.enum';
import { SignupDto } from '../dto/signup.dto';

jest.mock('argon2');

describe('AuthService', () => {
  let service: AuthService;
  let userService: {
    findOne: jest.Mock;
    create: jest.Mock;
  };
  let tokenService: {
    generateAndSetTokens: jest.Mock;
    clearTokens: jest.Mock;
  };
  let authCacheService: {
    createVerificationToken: jest.Mock;
    createSession: jest.Mock;
    findSession: jest.Mock;
    invalidateUserSession: jest.Mock;
  };
  let eventEmitter: {
    emit: jest.Mock;
  };
  let mockResponse: Partial<Response>;

  beforeEach(async () => {
    userService = {
      findOne: jest.fn(),
      create: jest.fn(),
    };

    tokenService = {
      generateAndSetTokens: jest.fn(),
      clearTokens: jest.fn(),
    };

    authCacheService = {
      createVerificationToken: jest.fn(),
      createSession: jest.fn(),
      findSession: jest.fn(),
      invalidateUserSession: jest.fn(),
    };

    eventEmitter = {
      emit: jest.fn(),
    };

    mockResponse = {
      cookie: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: userService },
        { provide: TokenService, useValue: tokenService },
        { provide: AuthCacheService, useValue: authCacheService },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('signup', () => {
    const signupDto: SignupDto = {
      username: 'new_chef',
      displayname: 'Chef Gordon',
      email: 'gordon@smak.ua',
      password: 'SecurePassword123!',
    };

    it('should throw ConflictException if username is already taken', async () => {
      userService.findOne
        .mockResolvedValueOnce(null) // email check
        .mockResolvedValueOnce({ id: 'existing-id' }); // username check

      await expect(
        service.signup(signupDto, mockResponse as Response),
      ).rejects.toThrow(
        new ConflictException('User with this username already exists!'),
      );

      expect(userService.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if email is already taken', async () => {
      userService.findOne.mockImplementation(async ({ email, username }) => {
        if (email) return { id: 'existing-email-user' };
        return null;
      });

      await expect(
        service.signup(signupDto, mockResponse as Response),
      ).rejects.toThrow(
        new ConflictException('User with this email already exists!'),
      );

      expect(userService.create).not.toHaveBeenCalled();
    });

    it('should successfully register user, cache verification token, emit event and return tokens', async () => {
      userService.findOne.mockResolvedValue(null);

      const createdUser = {
        id: 'usr-new-1',
        username: signupDto.username,
        displayname: signupDto.displayname,
        email: signupDto.email,
        role: UserRoleEnum.USER,
      };

      userService.create.mockResolvedValue(createdUser);
      tokenService.generateAndSetTokens.mockResolvedValue({
        accessToken: 'access-123',
        refreshToken: 'refresh-456',
      });

      const result = await service.signup(signupDto, mockResponse as Response);

      expect(userService.create).toHaveBeenCalledWith({
        username: signupDto.username,
        displayname: signupDto.displayname,
        email: signupDto.email,
        password: signupDto.password,
        role: UserRoleEnum.USER,
        dietary: [],
        allergies: [],
      });

      expect(authCacheService.createVerificationToken).toHaveBeenCalledWith(
        createdUser.id,
        expect.any(String),
      );

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'user.registered',
        expect.objectContaining({
          userId: createdUser.id,
          email: createdUser.email,
          token: expect.any(String),
          user: createdUser,
        }),
      );

      expect(authCacheService.createSession).toHaveBeenCalledWith(createdUser);
      expect(tokenService.generateAndSetTokens).toHaveBeenCalledWith(
        createdUser.id,
        mockResponse,
      );
      expect(result).toEqual({
        accessToken: 'access-123',
        refreshToken: 'refresh-456',
      });
    });
  });

  describe('login', () => {
    it('should throw ConflictException if user is not provided', async () => {
      await expect(
        service.login(null as unknown as User, mockResponse as Response),
      ).rejects.toThrow(ConflictException);
    });

    it('should create session, generate tokens and return them', async () => {
      const user = { id: 'usr-1', email: 'test@smak.ua' } as User;
      tokenService.generateAndSetTokens.mockResolvedValue({
        accessToken: 'jwt-access',
        refreshToken: 'jwt-refresh',
      });

      const result = await service.login(user, mockResponse as Response);

      expect(authCacheService.createSession).toHaveBeenCalledWith(user);
      expect(tokenService.generateAndSetTokens).toHaveBeenCalledWith(
        user.id,
        mockResponse,
      );
      expect(result).toEqual({
        accessToken: 'jwt-access',
        refreshToken: 'jwt-refresh',
      });
    });
  });

  describe('logout', () => {
    it('should invalidate session in cache and clear cookies', async () => {
      const result = await service.logout('usr-1', mockResponse as Response);

      expect(authCacheService.invalidateUserSession).toHaveBeenCalledWith(
        'usr-1',
      );
      expect(tokenService.clearTokens).toHaveBeenCalledWith(mockResponse);
      expect(result).toBe(true);
    });
  });

  describe('me', () => {
    it('should return session from Redis cache without hitting DB', async () => {
      const cachedDto = {
        id: 'usr-1',
        email: 'test@smak.ua',
        role: UserRoleEnum.USER,
      };
      authCacheService.findSession.mockResolvedValue(cachedDto);

      const result = await service.me('usr-1');

      expect(authCacheService.findSession).toHaveBeenCalledWith('usr-1');
      expect(userService.findOne).not.toHaveBeenCalled();
      expect(result).toEqual(cachedDto);
    });

    it('should fallback to database if session is not in cache', async () => {
      authCacheService.findSession.mockResolvedValue(null);
      const dbUser = {
        id: 'usr-1',
        email: 'test@smak.ua',
        username: 'john',
        role: UserRoleEnum.USER,
        isVerified: true,
        isBanned: false,
        dietary: [],
        allergies: [],
      };
      userService.findOne.mockResolvedValue(dbUser);

      const result = await service.me('usr-1');

      expect(userService.findOne).toHaveBeenCalledWith({ id: 'usr-1' });
      expect(result.id).toBe('usr-1');
      expect(result.email).toBe('test@smak.ua');
    });

    it('should throw NotFoundException if user is not in cache and not in DB', async () => {
      authCacheService.findSession.mockResolvedValue(null);
      userService.findOne.mockResolvedValue(null);

      await expect(service.me('unknown-user')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('validateUser', () => {
    it('should return null if user with given email does not exist', async () => {
      userService.findOne.mockResolvedValue(null);

      const result = await service.validateUser('missing@smak.ua', 'pass');

      expect(result).toBeNull();
    });

    it('should return null if password hash does not match', async () => {
      userService.findOne.mockResolvedValue({
        id: 'usr-1',
        email: 'test@smak.ua',
        passwordHash: 'stored-hash',
      });
      (argon2.verify as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser('test@smak.ua', 'wrong-pass');

      expect(argon2.verify).toHaveBeenCalledWith('stored-hash', 'wrong-pass');
      expect(result).toBeNull();
    });

    it('should return user object if credentials are valid', async () => {
      const user = {
        id: 'usr-1',
        email: 'test@smak.ua',
        passwordHash: 'valid-hash',
      };
      userService.findOne.mockResolvedValue(user);
      (argon2.verify as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('test@smak.ua', 'correct-pass');

      expect(argon2.verify).toHaveBeenCalledWith('valid-hash', 'correct-pass');
      expect(result).toEqual(user);
    });
  });
});
