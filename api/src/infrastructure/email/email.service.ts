import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  constructor(
    private mailerService: MailerService,
    private configService: ConfigService,
  ) {}

  async sendVerificationEmail(email: string, token: string) {
    const url = `${this.configService.get('FRONTEND_URL')}/auth/verify?token=${token}`;
    await this.mailerService.sendMail({
      to: email,
      subject: 'Confirm Your Email',
      html: `Please confirm your email by clicking the link: <a href="${url}">${url}</a>`,
    });
  }

  async sendResetPasswordEmail(email: string, token: string) {
    const url = `${this.configService.get('FRONTEND_URL')}/auth/reset-password?token=${token}`;
    await this.mailerService.sendMail({
      to: email,
      subject: 'Reset Password',
      html: `Click the link to reset your password: <a href="${url}">Reset Password</a>`,
    });
  }
}
