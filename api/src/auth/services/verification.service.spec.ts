import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as argon2 from 'argon2';
import { VerificationService } from './verification.service';
import { UserService } from '../../user/user.service';
import { AuthCacheService } from './auth-cache.service';

jest.mock('argon2');

describe('VerificationService', () => {
  let service: VerificationService;
  let userService: {
    findOne: jest.Mock;
    update: jest.Mock;
  };
  let authCacheService: {
    getUserIdByVerificationToken: jest.Mock;
    createVerificationToken: jest.Mock;
    getUserIdByResetToken: jest.Mock;
    createResetToken: jest.Mock;
    deleteToken: jest.Mock;
    invalidateUserSession: jest.Mock;
  };
  let eventEmitter: {
    emit: jest.Mock;
  };

  beforeEach(async () => {
    userService = {
      findOne: jest.fn(),
      update: jest.fn(),
    };

    authCacheService = {
      getUserIdByVerificationToken: jest.fn(),
      createVerificationToken: jest.fn(),
      getUserIdByResetToken: jest.fn(),
      createResetToken: jest.fn(),
      deleteToken: jest.fn(),
      invalidateUserSession: jest.fn(),
    };

    eventEmitter = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VerificationService,
        { provide: UserService, useValue: userService },
        { provide: AuthCacheService, useValue: authCacheService },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get<VerificationService>(VerificationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('verifyEmail', () => {
    it('should throw BadRequestException if token does not exist in cache', async () => {
      authCacheService.getUserIdByVerificationToken.mockResolvedValue(null);

      await expect(service.verifyEmail('invalid-token')).rejects.toThrow(
        new BadRequestException('Invalid token or user not found'),
      );
    });

    it('should throw BadRequestException if user is not found in database', async () => {
      authCacheService.getUserIdByVerificationToken.mockResolvedValue('user-1');
      userService.findOne.mockResolvedValue(null);

      await expect(service.verifyEmail('valid-token')).rejects.toThrow(
        new BadRequestException('Invalid token or user not found'),
      );
    });

    it('should throw BadRequestException if user is already verified', async () => {
      authCacheService.getUserIdByVerificationToken.mockResolvedValue('user-1');
      userService.findOne.mockResolvedValue({ id: 'user-1', isVerified: true });

      await expect(service.verifyEmail('valid-token')).rejects.toThrow(
        new BadRequestException('Email is already verified'),
      );
    });

    it('should successfully verify user, update database and remove token from cache', async () => {
      authCacheService.getUserIdByVerificationToken.mockResolvedValue('user-1');
      userService.findOne.mockResolvedValue({ id: 'user-1', isVerified: false });

      const result = await service.verifyEmail('valid-token');

      expect(userService.update).toHaveBeenCalledWith('user-1', { isVerified: true });
      expect(authCacheService.deleteToken).toHaveBeenCalledWith('verify-email', 'valid-token');
      expect(result).toBe(true);
    });
  });

  describe('resendVerification', () => {
    it('should throw BadRequestException if user not found', async () => {
      userService.findOne.mockResolvedValue(null);

      await expect(service.resendVerification('missing@smak.ua')).rejects.toThrow(
        new BadRequestException('Invalid email or email already verified'),
      );
    });

    it('should throw BadRequestException if user is already verified', async () => {
      userService.findOne.mockResolvedValue({ email: 'verified@smak.ua', isVerified: true });

      await expect(service.resendVerification('verified@smak.ua')).rejects.toThrow(
        new BadRequestException('Invalid email or email already verified'),
      );
    });

    it('should generate new token, cache it, emit event and return true', async () => {
      const user = {
        id: 'usr-1',
        email: 'unverified@smak.ua',
        isVerified: false,
        username: 'unverified_user',
        displayname: 'Unverified Chef',
      };
      userService.findOne.mockResolvedValue(user);

      const result = await service.resendVerification(user.email);

      expect(authCacheService.createVerificationToken).toHaveBeenCalledWith(
        user.id,
        expect.any(String),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'user.resend-verification-requested',
        expect.objectContaining({
          email: user.email,
          token: expect.any(String),
          userName: user.displayname,
        }),
      );
      expect(result).toBe(true);
    });
  });

  describe('forgotPassword', () => {
    it('should throw BadRequestException if user is not found', async () => {
      userService.findOne.mockResolvedValue(null);

      await expect(service.forgotPassword('missing@smak.ua')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should create reset token in cache, emit event and return true', async () => {
      const user = {
        id: 'usr-1',
        email: 'user@smak.ua',
        username: 'gordon',
        displayname: null,
      };
      userService.findOne.mockResolvedValue(user);

      const result = await service.forgotPassword(user.email);

      expect(authCacheService.createResetToken).toHaveBeenCalledWith(
        user.id,
        expect.any(String),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'user.password-reset-requested',
        expect.objectContaining({
          email: user.email,
          token: expect.any(String),
          userName: user.username,
        }),
      );
      expect(result).toBe(true);
    });
  });

  describe('resetPassword', () => {
    it('should throw BadRequestException if reset token is invalid or expired', async () => {
      authCacheService.getUserIdByResetToken.mockResolvedValue(null);

      await expect(service.resetPassword('expired-token', 'NewPass12345!')).rejects.toThrow(
        new BadRequestException('Token is invalid or has expired'),
      );
    });

    it('should hash new password, update user, delete token, invalidate session and emit event', async () => {
      authCacheService.getUserIdByResetToken.mockResolvedValue('user-1');
      (argon2.hash as jest.Mock).mockResolvedValue('hashed-new-password');
      const updatedUser = { id: 'user-1', email: 'user@smak.ua' };
      userService.update.mockResolvedValue(updatedUser);

      const result = await service.resetPassword('valid-reset-token', 'NewPass12345!');

      expect(argon2.hash).toHaveBeenCalledWith('NewPass12345!');
      expect(userService.update).toHaveBeenCalledWith('user-1', {
        passwordHash: 'hashed-new-password',
      });
      expect(authCacheService.deleteToken).toHaveBeenCalledWith(
        'reset-password',
        'valid-reset-token',
      );
      expect(authCacheService.invalidateUserSession).toHaveBeenCalledWith('user-1');
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'user.password.updated',
        updatedUser,
      );
      expect(result).toBe(true);
    });
  });
});
