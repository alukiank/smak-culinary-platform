import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EmailService } from '../email.service';

@Injectable()
export class EmailListener {
  private readonly logger = new Logger(EmailListener.name);

  constructor(private readonly emailService: EmailService) {}

  @OnEvent('user.registered')
  async handleUserRegisteredEvent(payload: {
    userId: string;
    email: string;
    token: string;
  }) {
    this.logger.log(
      `[Email] Sending verification email to: ${payload.email} (User: ${payload.userId})`,
    );
    try {
      await this.emailService.sendVerificationEmail(
        payload.email,
        payload.token,
      );
    } catch (error) {
      this.logger.error(
        `[Email] Failed to send verification email to ${payload.email}: ${error.message}`,
        error.stack,
      );
    }
  }

  @OnEvent('user.resend-verification-requested')
  async handleResendVerificationEvent(payload: {
    email: string;
    token: string;
  }) {
    this.logger.log(
      `[Email] Resending verification email to: ${payload.email}`,
    );
    try {
      await this.emailService.sendVerificationEmail(
        payload.email,
        payload.token,
      );
    } catch (error) {
      this.logger.error(
        `[Email] Failed to resend verification email to ${payload.email}: ${error.message}`,
        error.stack,
      );
    }
  }

  @OnEvent('user.password-reset-requested')
  async handlePasswordResetEvent(payload: { email: string; token: string }) {
    this.logger.log(
      `[Email] Sending password reset email to: ${payload.email}`,
    );
    try {
      await this.emailService.sendResetPasswordEmail(
        payload.email,
        payload.token,
      );
    } catch (error) {
      this.logger.error(
        `[Email] Failed to send password reset email to ${payload.email}: ${error.message}`,
        error.stack,
      );
    }
  }
}
