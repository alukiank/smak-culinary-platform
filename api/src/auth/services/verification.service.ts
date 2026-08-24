import { Injectable, BadRequestException } from '@nestjs/common';
import { UserService } from '../../user/user.service';
import { AuthCacheService } from './auth-cache.service';
import { randomBytes } from 'crypto';
import * as argon2 from 'argon2';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class VerificationService {
  constructor(
    private readonly userService: UserService,
    private readonly AuthCacheService: AuthCacheService,
    private readonly eventEmitter: EventEmitter2,
  ) { }

  async verifyEmail(token: string): Promise<boolean> {
    const userId =
      await this.AuthCacheService.getUserIdByVerificationToken(token);
    const user = await this.userService.findOne({ id: userId });
    if (!userId || !user) {
      throw new BadRequestException('Invalid token or user not found');
    }
    if (user.isVerified) {
      throw new BadRequestException('Email is already verified');
    }

    await this.userService.update(userId, { isVerified: true });
    await this.AuthCacheService.deleteToken('verify-email', token);
    return true;
  }

  async resendVerification(email: string): Promise<boolean> {
    const user = await this.userService.findOne({ email });
    if (!user || user.isVerified) {
      throw new BadRequestException('Invalid email or email already verified');
    }

    const verificationToken = randomBytes(32).toString('hex');
    await this.AuthCacheService.createVerificationToken(
      user.id,
      verificationToken,
    );

    this.eventEmitter.emit('user.resend-verification-requested', {
      email: user.email,
      token: verificationToken,
    });

    return true;
  }

  async forgotPassword(email: string): Promise<boolean> {
    const user = await this.userService.findOne({ email });
    if (!user) {
      throw new BadRequestException();
    }

    const resetToken = randomBytes(32).toString('hex');
    await this.AuthCacheService.createResetToken(user.id, resetToken);

    this.eventEmitter.emit('user.password-reset-requested', {
      email: user.email,
      token: resetToken,
    });

    return true;
  }

  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const userId = await this.AuthCacheService.getUserIdByResetToken(token);
    if (!userId) {
      throw new BadRequestException('Token is invalid or has expired');
    }

    const passwordHash = await argon2.hash(newPassword);
    await this.userService.update(userId, { passwordHash });

    await this.AuthCacheService.deleteToken('reset-password', token);
    await this.AuthCacheService.invalidateUserSession(userId);
    return true;
  }
}
