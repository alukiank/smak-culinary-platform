import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { Subscription } from './entities/subscription.entity';
import { Payment } from './entities/payment.entity';
import { BillingController } from './controllers/billing.controller';
import { BillingAdminController } from './controllers/billing.admin.controller';
import { BillingWebhookController } from './controllers/billing-webhook.controller';
import { LiqPayModule } from '../infrastructure/liqpay/liqpay.module';
import { SubscriptionService } from './services/subscription.service';
import { PaymentService } from './services/payment.service';
import { SubscriptionExpiryTask } from './tasks/subscription-expiry.task';
import { UserRegisteredListener } from './listeners/user-registered.listener';
import { UserDeletedSubscriptionListener } from './listeners/user-deleted-subscription.listener';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subscription, Payment]),
    ScheduleModule.forRoot(),
    LiqPayModule,
  ],
  controllers: [
    BillingController,
    BillingAdminController,
    BillingWebhookController,
  ],
  providers: [
    SubscriptionService,
    PaymentService,
    SubscriptionExpiryTask,
    UserRegisteredListener,
    UserDeletedSubscriptionListener,
  ],
  exports: [SubscriptionService, PaymentService],
})
export class BillingModule {}
