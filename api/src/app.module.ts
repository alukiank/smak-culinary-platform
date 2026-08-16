import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './infrastructure/database/database.module';
import { QueueModule } from './infrastructure/queue/queue.module';
import { ConfigModule } from '@nestjs/config';
import { RecipeModule } from './recipe/recipe.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { EmbedderModule } from './embedder/embedder.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { ChatModule } from './chat/chat.module';
import { GoogleAiModule } from './infrastructure/google-ai/google-ai.module';
import { ModerationModule } from './moderation/moderation.module';
import { BillingModule } from './billing/billing.module';
import { EmailModule } from './infrastructure/email/email.module';
import { CloudinaryModule } from './infrastructure/cloudinary/cloudinary.module';
import { AssistantModule } from './assistant/assistant.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { RecipeReviewModule } from './recipe-review/recipe-review.module';
import { RecipeReviewCommentModule } from './recipe-review-comment/recipe-review-comment.module';
import { RateLimitingModule } from './infrastructure/rate-limiting/rate-limiting.module';
import { RecipeCollectionModule } from './recipe-collection/recipe-collection.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    DatabaseModule,
    QueueModule,
    RecipeModule,
    RecipeReviewModule,
    UserModule,
    AuthModule,
    EmbedderModule,
    RedisModule,
    ChatModule,
    GoogleAiModule,
    ModerationModule,
    BillingModule,
    EmailModule,
    CloudinaryModule,
    AssistantModule,
    RecipeReviewCommentModule,
    RecipeCollectionModule,
    RateLimitingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
