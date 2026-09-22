import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { RolesGuard } from './roles.guard';
import { IsBannedGuard } from './is-banned.guard';
import { EmailVerificationGuard } from './email-verification.guard';
import { OptionalAuthGuard } from './optional-auth.guard';
import { UserRoleEnum } from '../../user/enums/user-role.enum';
import { ROLES_KEY } from '../decorators/roles-allowed.decorator';

function createMockExecutionContext(user: any): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
      getResponse: () => ({}),
      getNext: () => ({}),
    }),
    getHandler: () => jest.fn(),
    getClass: () => jest.fn(),
  } as unknown as ExecutionContext;
}

describe('Auth Guards', () => {
  describe('RolesGuard', () => {
    let guard: RolesGuard;
    let reflector: { getAllAndOverride: jest.Mock };

    beforeEach(async () => {
      reflector = {
        getAllAndOverride: jest.fn(),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          RolesGuard,
          { provide: Reflector, useValue: reflector },
        ],
      }).compile();

      guard = module.get<RolesGuard>(RolesGuard);
    });

    it('should allow access if no roles are required for route', () => {
      reflector.getAllAndOverride.mockReturnValue(undefined);
      const context = createMockExecutionContext(null);

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow access if user has the required role', () => {
      reflector.getAllAndOverride.mockReturnValue([UserRoleEnum.ADMIN]);
      const context = createMockExecutionContext({
        id: 'usr-1',
        role: UserRoleEnum.ADMIN,
      });

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should deny access if user does not have the required role', () => {
      reflector.getAllAndOverride.mockReturnValue([UserRoleEnum.ADMIN]);
      const context = createMockExecutionContext({
        id: 'usr-2',
        role: UserRoleEnum.USER,
      });

      expect(guard.canActivate(context)).toBe(false);
    });

    it('should deny access if user is undefined and route requires roles', () => {
      reflector.getAllAndOverride.mockReturnValue([UserRoleEnum.USER]);
      const context = createMockExecutionContext(undefined);

      expect(guard.canActivate(context)).toBe(false);
    });
  });

  describe('IsBannedGuard', () => {
    let guard: IsBannedGuard;

    beforeEach(() => {
      guard = new IsBannedGuard();
    });

    it('should allow access if user is not banned', () => {
      const context = createMockExecutionContext({
        id: 'usr-1',
        isBanned: false,
      });

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should throw ForbiddenException if user is banned', () => {
      const context = createMockExecutionContext({
        id: 'usr-banned',
        isBanned: true,
      });

      expect(() => guard.canActivate(context)).toThrow(
        new ForbiddenException('Your account has been banned.'),
      );
    });

    it('should allow access if user object is not present', () => {
      const context = createMockExecutionContext(null);

      expect(guard.canActivate(context)).toBe(true);
    });
  });

  describe('EmailVerificationGuard', () => {
    let guard: EmailVerificationGuard;

    beforeEach(() => {
      guard = new EmailVerificationGuard();
    });

    it('should throw UnauthorizedException if user is not present on request', () => {
      const context = createMockExecutionContext(null);

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    });

    it('should throw ForbiddenException if user email is not verified', () => {
      const context = createMockExecutionContext({
        id: 'usr-unverified',
        isVerified: false,
      });

      expect(() => guard.canActivate(context)).toThrow(
        new ForbiddenException(
          'Please verify your email to access this resource',
        ),
      );
    });

    it('should allow access if user email is verified', () => {
      const context = createMockExecutionContext({
        id: 'usr-verified',
        isVerified: true,
      });

      expect(guard.canActivate(context)).toBe(true);
    });
  });

  describe('OptionalAuthGuard', () => {
    let guard: OptionalAuthGuard;

    beforeEach(() => {
      guard = new OptionalAuthGuard();
    });

    it('should return user when user is authenticated', () => {
      const user = { id: 'usr-1', email: 'chef@smak.ua' };
      const result = guard.handleRequest(null, user);

      expect(result).toBe(user);
    });

    it('should return null without throwing error when user is not authenticated', () => {
      const result = guard.handleRequest(null, false);

      expect(result).toBeNull();
    });

    it('should return null without throwing error when there is an authentication error', () => {
      const result = guard.handleRequest(new Error('JWT expired'), null);

      expect(result).toBeNull();
    });
  });
});
