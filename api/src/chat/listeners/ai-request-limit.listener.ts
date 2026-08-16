import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AiRequestLimitService } from '../services/ai-request-limit.service';
import { SenderRoleEnum } from '../enums/sender-role.enum';
import { Message } from '../entities/message.entity';

@Injectable()
export class AiRequestLimitListener {
  constructor(private readonly aiRequestLimitService: AiRequestLimitService) {}

  @OnEvent('message.created')
  async handleMessageCreatedEvent(payload: {
    message: Message;
    userId: string;
  }) {
    const { message, userId } = payload;
    if (
      message &&
      message.role === SenderRoleEnum.USER &&
      !message.isInternal &&
      userId
    ) {
      await this.aiRequestLimitService.incrementDailyMessageCount(userId);
    }
  }
}
