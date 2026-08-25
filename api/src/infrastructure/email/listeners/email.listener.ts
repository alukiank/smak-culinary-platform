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
    userName?: string;
    user?: {
      username?: string;
      displayname?: string;
    };
  }) {
    const userName =
      payload.userName ||
      payload.user?.displayname ||
      payload.user?.username;

    this.logger.log(
      `[Email] Sending verification email to: ${payload.email} (User: ${payload.userId}, Name: ${userName || 'N/A'})`,
    );
    try {
      await this.emailService.sendVerificationEmail(
        payload.email,
        payload.token,
        userName,
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
    userName?: string;
  }) {
    this.logger.log(
      `[Email] Resending verification email to: ${payload.email} (Name: ${payload.userName || 'N/A'})`,
    );
    try {
      await this.emailService.sendResendVerificationEmail(
        payload.email,
        payload.token,
        payload.userName,
      );
    } catch (error) {
      this.logger.error(
        `[Email] Failed to resend verification email to ${payload.email}: ${error.message}`,
        error.stack,
      );
    }
  }

  @OnEvent('user.password-reset-requested')
  async handlePasswordResetEvent(payload: {
    email: string;
    token: string;
    userName?: string;
  }) {
    this.logger.log(
      `[Email] Sending password reset email to: ${payload.email} (Name: ${payload.userName || 'N/A'})`,
    );
    try {
      await this.emailService.sendResetPasswordEmail(
        payload.email,
        payload.token,
        payload.userName,
      );
    } catch (error) {
      this.logger.error(
        `[Email] Failed to send password reset email to ${payload.email}: ${error.message}`,
        error.stack,
      );
    }
  }

  @OnEvent('user.password.updated')
  async handlePasswordUpdatedEvent(user: {
    id: string;
    email: string;
    username?: string;
    displayname?: string;
  }) {
    if (!user || !user.email) return;

    const userName = user.displayname || user.username;
    this.logger.log(
      `[Email] Sending password changed alert to: ${user.email} (User: ${user.id})`,
    );
    try {
      await this.emailService.sendPasswordChangedEmail(
        user.email,
        userName,
      );
    } catch (error) {
      this.logger.error(
        `[Email] Failed to send password changed email to ${user.email}: ${error.message}`,
        error.stack,
      );
    }
  }
}

