import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './controllers/user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { AuthCacheService } from '../auth/services/auth-cache.service';
import { UserAdminController } from './controllers/user.admin.controller';
import { BillingModule } from '../billing/billing.module';
import { RestrictionsLimitGuard } from './guards/restrictions-limit.guard';
import { RecipeModule } from '../recipe/recipe.module';
import { RecipeReviewModule } from '../recipe-review/recipe-review.module';
import { UserBanListener } from './listeners/user-ban.listener';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    BillingModule,
    RecipeModule,
    RecipeReviewModule,
  ],
  controllers: [UserController, UserAdminController],
  providers: [
    UserService,
    AuthCacheService,
    RestrictionsLimitGuard,
    UserBanListener,
  ],
  exports: [UserService],
})
export class UserModule {}
