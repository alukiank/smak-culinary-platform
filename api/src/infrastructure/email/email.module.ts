import { Module, Global } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';
import { EmailListener } from './listeners/email.listener';
import { EMAIL_CONSTANTS } from './email.constants';

@Global()
@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        transport: {
          host: config.get('MAIL_HOST'),
          port: config.get('MAIL_PORT'),
          auth: {
            user: config.get('MAIL_USER'),
            pass: config.get('MAIL_PASS'),
          },
        },
        defaults: {
          from:
            config.get('MAIL_FROM') ||
            EMAIL_CONSTANTS.DEFAULT_FROM ||
            '"Smak" <noreply@smak-app.pp.ua>',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [EmailService, EmailListener],
  exports: [EmailService],
})
export class EmailModule {}
