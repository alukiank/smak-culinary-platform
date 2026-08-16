import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ChatService } from './chat.service';
import { MessageService } from './message.service';
import { AssistantService } from '../../assistant/assistant.service';
import { mergeChatMetadata } from '../utils/merge-chat-metadata.util';
import { UserService } from '../../user/user.service';
import { SendMessageDto } from '../dto/send-message.dto';
import { ChatMessageMetadataDto } from '../dto/create-message.dto';
import { SenderRoleEnum } from '../enums/sender-role.enum';
import { RecipeService } from '../../recipe/recipe.service';
import { Recipe } from '../../recipe/entities/recipe.entity';


@Injectable()
export class ChatOrchestratorService {
  private readonly logger = new Logger(ChatOrchestratorService.name);

  constructor(
    private readonly chatService: ChatService,
    private readonly messageService: MessageService,
    private readonly assistantService: AssistantService,
    private readonly userService: UserService,
    private readonly recipeService: RecipeService,
  ) { }

  async processUserMessage(
    dto: SendMessageDto,
    chatId: string,
    userId: string,
  ) {
    this.logger.log(
      `[Chat:${chatId}] Processing incoming message from user: ${userId}`,
    );

    const chat = await this.chatService.findOne(chatId, userId);
    if (!chat) throw new NotFoundException(`Chat not found`);

    let recipe: Recipe | null = null;
    if (chat.recipeId) {
      try {
        recipe = await this.recipeService.findOne(chat.recipeId);
      } catch (err) {
        this.logger.warn(
          `Failed to find recipe ${chat.recipeId} for chat ${chat.id}: ${err.message}`,
        );
      }
    }

    const user = await this.userService.findOne({ id: userId });

    await this.messageService.create(chatId, {
      role: SenderRoleEnum.USER,
      content: dto.text,
    });

    const history = await this.messageService.findRecentDialoguesWithSmartContext(
      chatId,
      10,
      3,
    );

    try {
      const assistantResult = await this.assistantService.generateResponse(
        history,
        chatId,
        user,
        undefined,
        recipe,
      );

      for (const internalMsg of assistantResult.internalMessages) {
        await this.messageService.create(chatId, {
          role: internalMsg.role,
          content: internalMsg.content,
          isInternal: true,
          toolData: internalMsg.toolData,
        });
      }

      return await this.messageService.create(chatId, {
        role: SenderRoleEnum.MODEL,
        content: assistantResult.text,
        metadata: assistantResult.metadata,
      });
    } catch (error) {
      this.logger.error(
        `[Chat:${chatId}] Failed to generate AI response: ${error.message}`,
        error.stack,
      );

      return await this.messageService.create(chatId, {
        role: SenderRoleEnum.MODEL,
        content:
          'Some error occurred while processing your request. Please try again later.',
        metadata: { isError: true },
      });
    }
  }

  async *processUserMessageStream(
    dto: SendMessageDto,
    chatId: string,
    userId: string,
  ): AsyncGenerator<{ type: string; data?: any }> {
    this.logger.log(
      `[Chat:${chatId}] Processing incoming STREAM message from user: ${userId}`,
    );

    const chat = await this.chatService.findOne(chatId, userId);
    if (!chat) throw new NotFoundException(`Chat not found`);

    let recipe: Recipe | null = null;
    if (chat.recipeId) {
      try {
        recipe = await this.recipeService.findOne(chat.recipeId);
      } catch (err) {
        this.logger.warn(
          `Failed to find recipe ${chat.recipeId} for chat ${chat.id}: ${err.message}`,
        );
      }
    }

    const user = await this.userService.findOne({ id: userId });

    await this.messageService.create(chatId, {
      role: SenderRoleEnum.USER,
      content: dto.text,
    });

    const history = await this.messageService.findRecentDialoguesWithSmartContext(
      chatId,
      10,
      3,
    );

    try {
      let accumulatedText = '';
      let finalMetadata: ChatMessageMetadataDto = {};

      const stream = this.assistantService.generateStreamResponse(
        history,
        chatId,
        user,
        undefined,
        recipe,
      );

      for await (const event of stream) {
        if (event.type === 'text_chunk') {
          accumulatedText += event.data;
          yield event;
        } else if (event.type === 'metadata') {
          finalMetadata = mergeChatMetadata(finalMetadata, event.data);
          yield event;
        } else if (event.type === 'internal_message') {
          await this.messageService.create(chatId, {
            role: event.data.role,
            content: event.data.content,
            isInternal: true,
            toolData: event.data.toolData,
          });
        } else {
          yield event;
        }
      }


      const savedMetadata =
        Object.keys(finalMetadata).length > 0 ? finalMetadata : undefined;

      await this.messageService.create(chatId, {
        role: SenderRoleEnum.MODEL,
        content: accumulatedText.trim(),
        metadata: savedMetadata,
      });

      yield { type: 'done' };
    } catch (error) {
      this.logger.error(
        `[Chat:${chatId}] Failed to stream AI response: ${error.message}`,
        error.stack,
      );

      const errorMessageContent =
        'Some error occurred while processing your request. Please try again later.';

      await this.messageService.create(chatId, {
        role: SenderRoleEnum.MODEL,
        content: errorMessageContent,
        metadata: { isError: true },
      });

      yield { type: 'stream_reset' };
      yield { type: 'text_chunk', data: errorMessageContent };
      yield { type: 'metadata', data: { isError: true } };
      yield { type: 'done' };
    }
  }
}
