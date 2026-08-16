import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ChatService } from './services/chat.service';
import { ChatController } from './chat.controller';
import { Chat } from './entities/chat.entity';
import { Message } from './entities/message.entity';
import { RecipeModule } from '../recipe/recipe.module';
import { MessageService } from './services/message.service';
import { UserModule } from '../user/user.module';
import { AssistantModule } from '../assistant/assistant.module';
import { ChatOrchestratorService } from './services/chat-orchestrator.service';
import { BillingModule } from '../billing/billing.module';
import { AiRequestLimitGuard } from './guards/ai-request-limit.guard';
import { RedisModule } from '../infrastructure/redis/redis.module';
import { AiRequestLimitService } from './services/ai-request-limit.service';
import { AiRequestLimitListener } from './listeners/ai-request-limit.listener';

@Module({
  imports: [
    TypeOrmModule.forFeature([Chat, Message]),
    ConfigModule,
    RecipeModule,
    UserModule,
    AssistantModule,
    BillingModule,
    RedisModule,
  ],
  controllers: [ChatController],
  providers: [
    ChatService,
    MessageService,
    ChatOrchestratorService,
    AiRequestLimitGuard,
    AiRequestLimitService,
    AiRequestLimitListener,
  ],
})
export class ChatModule {}
