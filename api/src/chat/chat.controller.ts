import {
  Controller,
  Post,
  Body,
  Param,
  Put,
  Get,
  Delete,
  Query,
  NotFoundException,
  ParseUUIDPipe,
  Sse,
  MessageEvent,
} from '@nestjs/common';
import { ChatService } from './services/chat.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { UpdateChatDto } from './dto/update-chat.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SendMessageDto } from './dto/send-message.dto';
import { CursorPaginationDto } from '../shared/dto/cursor-pagination.dto';
import { MessageService } from './services/message.service';
import { Chat } from './entities/chat.entity';
import { Message } from './entities/message.entity';
import { CursorPaginatedResponseDto } from '../shared/dto/cursor-paginated-response.dto';
import { ChatOrchestratorService } from './services/chat-orchestrator.service';
import { AiRequestLimitGuard } from './guards/ai-request-limit.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiCookieAuth,
  ApiParam,
  ApiQuery,
  ApiProduces,
} from '@nestjs/swagger';
import { Observable } from 'rxjs';

@ApiTags('Chats')
@ApiCookieAuth('jwt-access')
@UseGuards(AuthGuard('jwt-access'))
@Controller('chats')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly messageService: MessageService,
    private readonly chatOrchestratorService: ChatOrchestratorService,
  ) {}

  @ApiOperation({
    summary: 'Створення нового чату з AI-асистентом',
    description:
      'Створює новий чат (сесію розмови) між поточним користувачем та AI-асистентом. ' +
      "Назва чату є необов'язковою та може бути задана вручну (максимум 2000 символів).",
  })
  @ApiBody({ type: CreateChatDto })
  @ApiResponse({
    status: 201,
    description: 'Чат успішно створено.',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Мій кулінарний чат',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        summary: null,
        messageCount: 0,
        isArchived: false,
        recipeId: '550e8400-e29b-41d4-a716-446655440000',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error - e.g., title exceeds 2000 characters.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - access token is missing or invalid.',
  })
  @Post()
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateChatDto,
  ): Promise<Chat> {
    return this.chatService.create(userId, dto);
  }

  @ApiOperation({
    summary:
      'Отримання списку всіх чатів поточного користувача (cursor-пагінація)',
    description:
      'Повертає список чатів поточного авторизованого користувача у порядку спадання дати оновлення (updatedAt DESC). ' +
      'Використовує cursor-based пагінацію. Для отримання наступної сторінки передайте cursor із поля meta.nextCursor.',
  })
  @ApiQuery({
    name: 'cursor',
    required: false,
    description:
      'Курсор для наступної сторінки. Формат: "ISO8601Date_UUID" (наприклад, "2026-01-01T00:00:00.000Z_550e8400...").',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Кількість елементів на сторінку (за замовчуванням 15).',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Список чатів з метаданими пагінації.',
    schema: {
      example: {
        data: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            title: 'Чат про випічку',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-02T00:00:00.000Z',
            summary: 'Обговорення рецептів хліба',
            messageCount: 5,
            isArchived: false,
            recipeId: null,
          },
        ],
        meta: {
          nextCursor:
            '2026-01-01T00:00:00.000Z_550e8400-e29b-41d4-a716-446655440000',
          hasNextPage: true,
          limit: 15,
          itemCount: 15,
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @Get()
  async findAllWithPagination(
    @CurrentUser('id') userId: string,
    @Query() paginationDto: CursorPaginationDto,
  ): Promise<CursorPaginatedResponseDto<Chat>> {
    return this.chatService.findAllWithPagination(userId, paginationDto);
  }

  @ApiOperation({
    summary: 'Отримання повідомлень конкретного чату (cursor-пагінація)',
    description:
      'Повертає список повідомлень для вказаного чату. ' +
      'Чат повинен належати поточному авторизованому користувачеві. ' +
      'Використовує cursor-based пагінацію. Кожне повідомлення має роль (user/model), ' +
      'текстовий контент та опціональні метадані (рецепти, feedback, ознака помилки).',
  })
  @ApiParam({ name: 'id', description: 'UUID чату.', type: String })
  @ApiQuery({
    name: 'cursor',
    required: false,
    description: 'Курсор для наступної сторінки.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Кількість повідомлень на сторінку (за замовчуванням 15).',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Список повідомлень чату.',
    schema: {
      example: {
        data: [
          {
            id: 'msg-uuid',
            role: 'user',
            content: 'Як приготувати борщ?',
            createdAt: '2026-01-01T12:00:00.000Z',
            metadata: null,
          },
          {
            id: 'msg-uuid-2',
            role: 'model',
            content: 'Ось рецепт класичного борщу...',
            createdAt: '2026-01-01T12:00:05.000Z',
            metadata: {
              recipes: [
                {
                  id: 'recipe-uuid',
                  title: 'Борщ',
                  description: 'Класичний рецепт',
                },
              ],
            },
          },
        ],
        meta: {
          nextCursor: '...',
          hasNextPage: false,
          limit: 15,
          itemCount: 2,
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 404,
    description: 'Chat not found or does not belong to the current user.',
  })
  @Get(':id/messages')
  async getMessages(
    @Param('id', new ParseUUIDPipe()) chatId: string,
    @CurrentUser('id') userId: string,
    @Query() paginationDto: CursorPaginationDto,
  ): Promise<CursorPaginatedResponseDto<Message>> {
    const chat = await this.chatService.findOne(chatId, userId);
    if (!chat) throw new NotFoundException();

    return this.messageService.findAllWithPagination(chatId, paginationDto);
  }

  @ApiOperation({
    summary: 'Отримання конкретного чату за ID',
    description:
      'Повертає дані конкретного чату. Чат повинен належати поточному авторизованому користувачеві.',
  })
  @ApiParam({ name: 'id', description: 'UUID чату.', type: String })
  @ApiResponse({
    status: 200,
    description: 'Дані чату.',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Мій кулінарний чат',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
        summary: 'Обговорення рецептів',
        messageCount: 10,
        isArchived: false,
        recipeId: '550e8400-e29b-41d4-a716-446655440000',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 404,
    description: 'Chat not found or does not belong to the current user.',
  })
  @Get(':id')
  async findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<Chat> {
    const chat = await this.chatService.findOne(id, userId);
    if (!chat) throw new NotFoundException();
    return chat;
  }

  @ApiOperation({
    summary: 'Оновлення даних чату',
    description:
      'Оновлює назву, стан архівування або summary чату. Чат повинен належати поточному користувачеві. ' +
      "Всі поля є необов'язковими (часткове оновлення).",
  })
  @ApiParam({ name: 'id', description: 'UUID чату.', type: String })
  @ApiBody({ type: UpdateChatDto })
  @ApiResponse({
    status: 200,
    description: 'Чат успішно оновлено.',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Оновлена назва',
        isArchived: true,
        summary: 'Короткий опис',
        messageCount: 10,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
        recipeId: null,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Validation error.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Chat not found.' })
  @Put(':id')
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser('id') userId: string,
    @Body() updateChatDto: UpdateChatDto,
  ): Promise<Chat> {
    return this.chatService.update(id, userId, updateChatDto);
  }

  @ApiOperation({
    summary: 'Видалення чату',
    description:
      'Видаляє чат разом із усіма його повідомленнями (CASCADE). ' +
      'Чат повинен належати поточному авторизованому користувачеві.',
  })
  @ApiParam({ name: 'id', description: 'UUID чату.', type: String })
  @ApiResponse({
    status: 200,
    description: 'Чат успішно видалено — повертає true.',
    schema: { example: true },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Chat not found.' })
  @Delete(':id')
  async remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<boolean> {
    return this.chatService.remove(id, userId);
  }

  @ApiOperation({
    summary: 'Надсилання повідомлення (Синхронно)',
    description:
      'Зберігає повідомлення користувача та повертає повну відповідь асистента разом із метаданими.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID чату',
    type: 'string',
    format: 'uuid',
  })
  @ApiBody({ type: SendMessageDto })
  @ApiResponse({
    status: 201,
    description: 'Success.',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440001',
        role: 'model',
        content: 'Ось ваші рецепти:',
        metadata: {
          recipes: [
            { id: 'uuid', title: 'Борщ', rating: 5, coverImageId: 'id' },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description:
      'Forbidden - Daily AI request limit reached for active subscription plan (e.g., 10 for Free, 50 for Pro).',
  })
  @UseGuards(AiRequestLimitGuard)
  @Post(':id/messages')
  async sendMessage(
    @Param('id', new ParseUUIDPipe()) chatId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: SendMessageDto,
  ): Promise<Message> {
    return this.chatOrchestratorService.processUserMessage(dto, chatId, userId);
  }

  @ApiOperation({
    summary: 'Стрімінг відповіді (SSE)',
    description:
      'Потокова передача відповіді (text/event-stream). Використовує POST для передачі тіла запиту. ' +
      'Для клієнта обов’язкове використання бібліотеки **@microsoft/fetch-event-source**.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID чату',
    type: 'string',
    format: 'uuid',
  })
  @ApiBody({ type: SendMessageDto })
  @ApiProduces('text/event-stream')
  @ApiResponse({
    status: 200,
    description:
      'Потік подій: text_chunk (текст), metadata (об’єкт ChatMessageMetadataDto), done, error.',
  })
  @ApiResponse({
    status: 403,
    description:
      'Forbidden - Daily AI request limit reached for active subscription plan (e.g., 10 for Free, 50 for Pro).',
  })
  @UseGuards(AiRequestLimitGuard)
  @Post(':id/messages/stream')
  @Sse(':id/messages/stream')
  async streamMessage(
    @Param('id') chatId: string,
    @Body() dto: SendMessageDto,
    @CurrentUser() user: any,
  ): Promise<Observable<MessageEvent>> {
    const streamGenerator =
      this.chatOrchestratorService.processUserMessageStream(
        dto,
        chatId,
        user.id,
      );

    return new Observable((subscriber) => {
      (async () => {
        try {
          for await (const event of streamGenerator) {
            subscriber.next({
              data: event.data,
              type: event.type,
            });
          }
          subscriber.complete();
        } catch (err) {
          subscriber.error(err);
        }
      })();
    });
  }
}
