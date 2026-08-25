import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import {
  renderVerifyEmailTemplate,
  renderResendVerifyEmailTemplate,
  renderResetPasswordTemplate,
  renderPasswordChangedTemplate,
} from './templates';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private mailerService: MailerService,
    private configService: ConfigService,
  ) {}

  private getFrontendUrl(): string {
    return this.configService.get<string>('FRONTEND_URL') || 'https://smak-app.pp.ua';
  }

  async sendVerificationEmail(
    email: string,
    token: string,
    userName?: string,
  ) {
    const frontendUrl = this.getFrontendUrl();
    const url = `${frontendUrl}/auth/verify?token=${token}`;
    const { subject, html, text } = renderVerifyEmailTemplate({
      userName,
      verifyUrl: url,
      frontendUrl,
    });

    this.logger.log(`[EmailService] Sending verification email to ${email}`);
    await this.mailerService.sendMail({
      to: email,
      subject,
      html,
      text,
    });
  }

  async sendResendVerificationEmail(
    email: string,
    token: string,
    userName?: string,
  ) {
    const frontendUrl = this.getFrontendUrl();
    const url = `${frontendUrl}/auth/verify?token=${token}`;
    const { subject, html, text } = renderResendVerifyEmailTemplate({
      userName,
      verifyUrl: url,
      frontendUrl,
    });

    this.logger.log(`[EmailService] Sending resend verification email to ${email}`);
    await this.mailerService.sendMail({
      to: email,
      subject,
      html,
      text,
    });
  }

  async sendResetPasswordEmail(
    email: string,
    token: string,
    userName?: string,
  ) {
    const frontendUrl = this.getFrontendUrl();
    const url = `${frontendUrl}/auth/reset-password?token=${token}`;
    const { subject, html, text } = renderResetPasswordTemplate({
      userName,
      resetUrl: url,
      expireMinutes: 60,
      frontendUrl,
    });

    this.logger.log(`[EmailService] Sending password reset email to ${email}`);
    await this.mailerService.sendMail({
      to: email,
      subject,
      html,
      text,
    });
  }

  async sendPasswordChangedEmail(
    email: string,
    userName?: string,
  ) {
    const frontendUrl = this.getFrontendUrl();
    const { subject, html, text } = renderPasswordChangedTemplate({
      userName,
      frontendUrl,
      forgotPasswordUrl: `${frontendUrl}/auth/forgot-password`,
    });

    this.logger.log(`[EmailService] Sending password changed notification to ${email}`);
    await this.mailerService.sendMail({
      to: email,
      subject,
      html,
      text,
    });
  }
}

