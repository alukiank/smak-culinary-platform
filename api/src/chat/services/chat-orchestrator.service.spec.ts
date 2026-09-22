import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ChatOrchestratorService } from './chat-orchestrator.service';
import { ChatService } from './chat.service';
import { MessageService } from './message.service';
import { AssistantService } from '../../assistant/assistant.service';
import { UserService } from '../../user/user.service';
import { RecipeService } from '../../recipe/recipe.service';
import { SenderRoleEnum } from '../enums/sender-role.enum';
import { Chat } from '../entities/chat.entity';
import { User } from '../../user/entities/user.entity';

describe('ChatOrchestratorService', () => {
  let service: ChatOrchestratorService;
  let chatService: { findOne: jest.Mock };
  let messageService: {
    create: jest.Mock;
    findRecentDialoguesWithSmartContext: jest.Mock;
  };
  let assistantService: {
    generateResponse: jest.Mock;
    generateStreamResponse: jest.Mock;
  };
  let userService: { findOne: jest.Mock };
  let recipeService: { findOne: jest.Mock };

  beforeEach(async () => {
    chatService = { findOne: jest.fn() };
    messageService = {
      create: jest.fn(),
      findRecentDialoguesWithSmartContext: jest.fn().mockResolvedValue([]),
    };
    assistantService = {
      generateResponse: jest.fn(),
      generateStreamResponse: jest.fn(),
    };
    userService = { findOne: jest.fn() };
    recipeService = { findOne: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatOrchestratorService,
        { provide: ChatService, useValue: chatService },
        { provide: MessageService, useValue: messageService },
        { provide: AssistantService, useValue: assistantService },
        { provide: UserService, useValue: userService },
        { provide: RecipeService, useValue: recipeService },
      ],
    }).compile();

    service = module.get<ChatOrchestratorService>(ChatOrchestratorService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('processUserMessage (Synchronous)', () => {
    const chatId = 'chat-1';
    const userId = 'usr-1';

    it('should throw NotFoundException if chat is not found', async () => {
      chatService.findOne.mockResolvedValue(null);

      await expect(
        service.processUserMessage({ text: 'Hello' }, chatId, userId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should save user message, call assistant, save internal tool messages and model response', async () => {
      const mockChat = { id: chatId, userId, recipeId: 'rec-1' } as unknown as Chat;
      const mockUser = { id: userId, username: 'chef' } as User;
      const mockRecipe = { id: 'rec-1', title: 'Pasta' };

      chatService.findOne.mockResolvedValue(mockChat);
      userService.findOne.mockResolvedValue(mockUser);
      recipeService.findOne.mockResolvedValue(mockRecipe);

      assistantService.generateResponse.mockResolvedValue({
        text: 'Here is your recipe recommendations!',
        metadata: { recipeIds: ['rec-1', 'rec-2'] },
        internalMessages: [
          {
            role: SenderRoleEnum.MODEL,
            content: '',
            isInternal: true,
            toolData: { call: 'search_recipes' },
          },
        ],
      });

      messageService.create.mockImplementation(async (cId, data) => ({
        id: 'msg-new',
        ...data,
      }));

      const result = await service.processUserMessage(
        { text: 'Find pasta recipes' },
        chatId,
        userId,
      );

      // Verify user message created
      expect(messageService.create).toHaveBeenCalledWith(chatId, {
        role: SenderRoleEnum.USER,
        content: 'Find pasta recipes',
      });

      // Verify internal tool message saved
      expect(messageService.create).toHaveBeenCalledWith(chatId, {
        role: SenderRoleEnum.MODEL,
        content: '',
        isInternal: true,
        toolData: { call: 'search_recipes' },
      });

      // Verify final model message created with metadata
      expect(messageService.create).toHaveBeenCalledWith(chatId, {
        role: SenderRoleEnum.MODEL,
        content: 'Here is your recipe recommendations!',
        metadata: { recipeIds: ['rec-1', 'rec-2'] },
      });

      expect(result.content).toBe('Here is your recipe recommendations!');
    });

    it('should handle assistant failure gracefully and return error model message without crashing', async () => {
      chatService.findOne.mockResolvedValue({ id: chatId, userId } as unknown as Chat);
      userService.findOne.mockResolvedValue({ id: userId } as User);

      assistantService.generateResponse.mockRejectedValue(
        new Error('Gemini API quota exceeded or timeout'),
      );

      messageService.create.mockImplementation(async (cId, data) => ({
        id: 'msg-err',
        ...data,
      }));

      const result = await service.processUserMessage(
        { text: 'Hello' },
        chatId,
        userId,
      );

      expect(messageService.create).toHaveBeenCalledWith(chatId, {
        role: SenderRoleEnum.MODEL,
        content: 'Some error occurred while processing your request. Please try again later.',
        metadata: { isError: true },
      });
      expect(result.metadata).toEqual({ isError: true });
    });
  });

  describe('processUserMessageStream (Server-Sent Events)', () => {
    const chatId = 'chat-stream-1';
    const userId = 'usr-stream-1';

    it('should yield text chunks, save internal messages, merge metadata and yield done', async () => {
      chatService.findOne.mockResolvedValue({ id: chatId, userId } as unknown as Chat);
      userService.findOne.mockResolvedValue({ id: userId } as User);

      async function* mockStreamGenerator() {
        yield { type: 'text_chunk', data: 'Hello ' };
        yield { type: 'internal_message', data: { role: SenderRoleEnum.MODEL, content: '', toolData: { tool: 'search' } } };
        yield { type: 'text_chunk', data: 'world!' };
        yield { type: 'metadata', data: { recipeIds: ['rec-99'] } };
      }

      assistantService.generateStreamResponse.mockReturnValue(mockStreamGenerator());
      messageService.create.mockResolvedValue({ id: 'msg-1' });

      const generator = service.processUserMessageStream(
        { text: 'Hi' },
        chatId,
        userId,
      );

      const events: any[] = [];
      for await (const event of generator) {
        events.push(event);
      }

      // Check emitted stream events sequence
      expect(events).toEqual([
        { type: 'text_chunk', data: 'Hello ' },
        { type: 'text_chunk', data: 'world!' },
        { type: 'metadata', data: { recipeIds: ['rec-99'] } },
        { type: 'done' },
      ]);

      // Verify internal tool message was persisted to DB
      expect(messageService.create).toHaveBeenCalledWith(chatId, {
        role: SenderRoleEnum.MODEL,
        content: '',
        isInternal: true,
        toolData: { tool: 'search' },
      });

      // Verify final accumulated model message persisted
      expect(messageService.create).toHaveBeenCalledWith(chatId, {
        role: SenderRoleEnum.MODEL,
        content: 'Hello world!',
        metadata: { recipeIds: ['rec-99'] },
      });
    });

    it('should handle stream abort / Gemini exception gracefully and yield stream_reset with fallback error', async () => {
      chatService.findOne.mockResolvedValue({ id: chatId, userId } as unknown as Chat);
      userService.findOne.mockResolvedValue({ id: userId } as User);

      async function* failingStreamGenerator() {
        yield { type: 'text_chunk', data: 'Partial...' };
        throw new Error('Gemini connection reset by peer');
      }

      assistantService.generateStreamResponse.mockReturnValue(failingStreamGenerator());
      messageService.create.mockResolvedValue({ id: 'msg-err' });

      const generator = service.processUserMessageStream(
        { text: 'Stream message' },
        chatId,
        userId,
      );

      const events: any[] = [];
      for await (const event of generator) {
        events.push(event);
      }

      expect(events).toEqual([
        { type: 'text_chunk', data: 'Partial...' },
        { type: 'stream_reset' },
        {
          type: 'text_chunk',
          data: 'Some error occurred while processing your request. Please try again later.',
        },
        { type: 'metadata', data: { isError: true } },
        { type: 'done' },
      ]);

      expect(messageService.create).toHaveBeenCalledWith(chatId, {
        role: SenderRoleEnum.MODEL,
        content: 'Some error occurred while processing your request. Please try again later.',
        metadata: { isError: true },
      });
    });
  });
});
