import { Test, TestingModule } from '@nestjs/testing';
import { AssistantService } from './assistant.service';
import { GoogleAiService } from '../infrastructure/google-ai/services/google-ai.service';
import { ToolHandlerService } from './tools/tool-handler.service';
import { User } from '../user/entities/user.entity';
import { SenderRoleEnum } from '../chat/enums/sender-role.enum';
import { Message } from '../chat/entities/message.entity';
import { AssistantPersona } from '../shared/prompt-builder/enums/assistant-persona.enum';

describe('AssistantService', () => {
  let service: AssistantService;
  let googleAiService: jest.Mocked<GoogleAiService>;
  let toolHandlerService: jest.Mocked<ToolHandlerService>;

  const mockUser = {
    id: 'user-uuid-1',
    allergies: ['Peanuts'],
    dietary: ['Vegetarian'],
  } as User;

  const mockChatId = 'chat-uuid-1';

  beforeEach(async () => {
    const mockGoogleAi = {
      sendGenerateContentRequest: jest.fn(),
      sendGenerateContentStreamRequest: jest.fn(),
    };

    const mockToolHandler = {
      executeFunctionCall: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssistantService,
        { provide: GoogleAiService, useValue: mockGoogleAi },
        { provide: ToolHandlerService, useValue: mockToolHandler },
      ],
    }).compile();

    service = module.get<AssistantService>(AssistantService);
    googleAiService = module.get(GoogleAiService);
    toolHandlerService = module.get(ToolHandlerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateResponse', () => {
    it('should generate a simple text response without tool calls', async () => {
      const history: Message[] = [
        {
          id: 'msg-1',
          chatId: mockChatId,
          role: SenderRoleEnum.USER,
          content: 'Hello chef!',
          createdAt: new Date(),
        } as unknown as Message,
      ];

      googleAiService.sendGenerateContentRequest.mockResolvedValueOnce({
        candidates: [
          {
            content: {
              role: 'model',
              parts: [{ text: 'Hello! How can I help you today?' }],
            },
          },
        ],
        functionCalls: [],
      } as any);

      const result = await service.generateResponse(
        history,
        mockChatId,
        mockUser,
        AssistantPersona.BASIC,
      );

      expect(result.text).toBe('Hello! How can I help you today?');
      expect(result.metadata).toBeUndefined();
      expect(result.internalMessages).toHaveLength(0);
      expect(googleAiService.sendGenerateContentRequest).toHaveBeenCalledTimes(1);
    });

    it('should handle tool call loop, execute tool, merge metadata, and return final text', async () => {
      const history: Message[] = [
        {
          id: 'msg-1',
          chatId: mockChatId,
          role: SenderRoleEnum.USER,
          content: 'Suggest a soup',
          createdAt: new Date(),
        } as unknown as Message,
      ];

      // Iteration 1: Model requests a tool call
      googleAiService.sendGenerateContentRequest.mockResolvedValueOnce({
        candidates: [
          {
            content: {
              role: 'model',
              parts: [
                { text: 'Looking for soup recipes...' },
                {
                  functionCall: {
                    name: 'find_recipes',
                    args: { query: 'soup' },
                  },
                },
              ],
            },
          },
        ],
        functionCalls: [
          {
            name: 'find_recipes',
            args: { query: 'soup' },
          },
        ],
      } as any);

      toolHandlerService.executeFunctionCall.mockResolvedValueOnce({
        result: [{ id: 'recipe-101', title: 'Borscht' }],
        clientMetadata: {
          recipes: [{ id: 'recipe-101', title: 'Borscht' } as any],
        },
      });

      // Iteration 2: Model finishes with final text
      googleAiService.sendGenerateContentRequest.mockResolvedValueOnce({
        candidates: [
          {
            content: {
              role: 'model',
              parts: [{ text: ' I found Borscht for you!' }],
            },
          },
        ],
        functionCalls: [],
      } as any);

      const result = await service.generateResponse(
        history,
        mockChatId,
        mockUser,
        AssistantPersona.BASIC,
      );

      expect(result.text).toBe('Looking for soup recipes... I found Borscht for you!');
      expect(result.metadata).toEqual({
        recipes: [{ id: 'recipe-101', title: 'Borscht' }],
      });
      // 2 internal messages: 1 MODEL message (with tool call) + 1 USER message (with function response)
      expect(result.internalMessages).toHaveLength(2);
      expect(result.internalMessages[0].role).toBe(SenderRoleEnum.MODEL);
      expect(result.internalMessages[1].role).toBe(SenderRoleEnum.USER);
      expect(result.internalMessages[1].toolData.functionResponses[0]).toEqual({
        name: 'find_recipes',
        response: [{ id: 'recipe-101', title: 'Borscht' }],
      });

      expect(toolHandlerService.executeFunctionCall).toHaveBeenCalledWith(
        'find_recipes',
        { query: 'soup' },
        mockChatId,
      );
      expect(googleAiService.sendGenerateContentRequest).toHaveBeenCalledTimes(2);
    });

    it('should catch tool execution error and provide error payload back to Gemini without crashing', async () => {
      const history: Message[] = [];

      googleAiService.sendGenerateContentRequest.mockResolvedValueOnce({
        candidates: [
          {
            content: {
              role: 'model',
              parts: [
                {
                  functionCall: {
                    name: 'failing_tool',
                    args: {},
                  },
                },
              ],
            },
          },
        ],
        functionCalls: [
          {
            name: 'failing_tool',
            args: {},
          },
        ],
      } as any);

      toolHandlerService.executeFunctionCall.mockRejectedValueOnce(
        new Error('Database timeout'),
      );

      googleAiService.sendGenerateContentRequest.mockResolvedValueOnce({
        candidates: [
          {
            content: {
              role: 'model',
              parts: [{ text: 'Sorry, could not fetch recipes.' }],
            },
          },
        ],
        functionCalls: [],
      } as any);

      const result = await service.generateResponse(
        history,
        mockChatId,
        mockUser,
      );

      expect(result.text).toBe('Sorry, could not fetch recipes.');
      expect(result.internalMessages).toHaveLength(2);
      expect(
        result.internalMessages[1].toolData.functionResponses[0].response,
      ).toEqual({
        error: expect.stringContaining('Database timeout'),
      });
      expect(googleAiService.sendGenerateContentRequest).toHaveBeenCalledTimes(2);
    });

    it('should stop tool loop at maximum 5 iterations', async () => {
      // Mock 6 continuous function call responses
      const infiniteToolResponse = {
        candidates: [
          {
            content: {
              role: 'model',
              parts: [
                {
                  functionCall: {
                    name: 'loop_tool',
                    args: {},
                  },
                },
              ],
            },
          },
        ],
        functionCalls: [
          {
            name: 'loop_tool',
            args: {},
          },
        ],
      } as any;

      googleAiService.sendGenerateContentRequest.mockResolvedValue(infiniteToolResponse);
      toolHandlerService.executeFunctionCall.mockResolvedValue({
        result: { status: 'looping' },
      });

      await service.generateResponse([], mockChatId, mockUser);

      // 1 initial call + 5 iterations = 6 total requests
      expect(googleAiService.sendGenerateContentRequest).toHaveBeenCalledTimes(6);
      expect(toolHandlerService.executeFunctionCall).toHaveBeenCalledTimes(5);
    });

    it('should strip tool placeholders from previous message history', async () => {
      const historyWithPlaceholders: Message[] = [
        {
          id: 'msg-1',
          chatId: mockChatId,
          role: SenderRoleEnum.MODEL,
          content: 'Here is a soup: [Recipe:recipe-123] [Diets] [Allergies]',
          createdAt: new Date(),
        } as unknown as Message,
        {
          id: 'msg-2',
          chatId: mockChatId,
          role: SenderRoleEnum.USER,
          content: 'Give me another one',
          createdAt: new Date(),
        } as unknown as Message,
      ];

      googleAiService.sendGenerateContentRequest.mockResolvedValueOnce({
        candidates: [
          {
            content: {
              role: 'model',
              parts: [{ text: 'Here is another one' }],
            },
          },
        ],
        functionCalls: [],
      } as any);

      await service.generateResponse(
        historyWithPlaceholders,
        mockChatId,
        mockUser,
      );

      const passedContents = googleAiService.sendGenerateContentRequest.mock.calls[0][0];
      // Check that the first content item had the placeholders stripped
      expect(passedContents[0].parts[0].text).toBe('Here is a soup:   ');
      expect(passedContents[1].parts[0].text).toBe('Give me another one');
    });
  });

  describe('generateStreamResponse', () => {
    it('should stream text chunks correctly', async () => {
      const mockStream = (async function* () {
        yield {
          candidates: [
            {
              content: {
                parts: [{ text: 'First chunk. ' }],
              },
            },
          ],
        };
        yield {
          candidates: [
            {
              content: {
                parts: [{ text: 'Second chunk.' }],
              },
            },
          ],
        };
      })();

      googleAiService.sendGenerateContentStreamRequest.mockResolvedValueOnce(
        mockStream as any,
      );

      const generator = service.generateStreamResponse([], mockChatId, mockUser);

      const yieldedItems: any[] = [];
      for await (const item of generator) {
        yieldedItems.push(item);
      }

      expect(yieldedItems).toEqual([
        { type: 'text_chunk', data: 'First chunk. ' },
        { type: 'text_chunk', data: 'Second chunk.' },
      ]);
    });

    it('should handle tool calls in stream mode, yield internal messages and metadata', async () => {
      // First stream yields a tool call
      const stream1 = (async function* () {
        yield {
          candidates: [
            {
              content: {
                parts: [
                  { text: 'Searching...' },
                  {
                    functionCall: {
                      name: 'find_recipes',
                      args: { query: 'salad' },
                    },
                  },
                ],
              },
            },
          ],
          functionCalls: [
            {
              name: 'find_recipes',
              args: { query: 'salad' },
            },
          ],
        };
      })();

      // Second stream yields the final answer
      const stream2 = (async function* () {
        yield {
          candidates: [
            {
              content: {
                parts: [{ text: 'Here is your Caesar salad!' }],
              },
            },
          ],
          functionCalls: [],
        };
      })();

      googleAiService.sendGenerateContentStreamRequest
        .mockResolvedValueOnce(stream1 as any)
        .mockResolvedValueOnce(stream2 as any);

      toolHandlerService.executeFunctionCall.mockResolvedValueOnce({
        result: [{ id: 'recipe-salad-1' }],
        clientMetadata: {
          recipes: [{ id: 'recipe-salad-1' } as any],
        },
      });

      const generator = service.generateStreamResponse([], mockChatId, mockUser);

      const yieldedItems: any[] = [];
      for await (const item of generator) {
        yieldedItems.push(item);
      }

      // Check sequence of yielded items
      const types = yieldedItems.map((y) => y.type);
      expect(types).toContain('text_chunk');
      expect(types).toContain('internal_message');
      expect(types).toContain('metadata');

      const metadataItem = yieldedItems.find((y) => y.type === 'metadata');
      expect(metadataItem.data).toEqual({
        recipes: [{ id: 'recipe-salad-1' }],
      });

      // Check placeholder chunk yielded for recipe
      const placeholderChunk = yieldedItems.find(
        (y) => y.type === 'text_chunk' && y.data.includes('[Recipe:recipe-salad-1]'),
      );
      expect(placeholderChunk).toBeDefined();

      expect(toolHandlerService.executeFunctionCall).toHaveBeenCalledWith(
        'find_recipes',
        { query: 'salad' },
        mockChatId,
      );
    });

    it('should yield tool error payload and continue stream if tool handler fails', async () => {
      const stream1 = (async function* () {
        yield {
          candidates: [
            {
              content: {
                parts: [
                  {
                    functionCall: {
                      name: 'failing_stream_tool',
                      args: {},
                    },
                  },
                ],
              },
            },
          ],
          functionCalls: [
            {
              name: 'failing_stream_tool',
              args: {},
            },
          ],
        };
      })();

      const stream2 = (async function* () {
        yield {
          candidates: [
            {
              content: {
                parts: [{ text: 'Tool failed but stream recovered.' }],
              },
            },
          ],
          functionCalls: [],
        };
      })();

      googleAiService.sendGenerateContentStreamRequest
        .mockResolvedValueOnce(stream1 as any)
        .mockResolvedValueOnce(stream2 as any);

      toolHandlerService.executeFunctionCall.mockRejectedValueOnce(
        new Error('Stream tool crash'),
      );

      const generator = service.generateStreamResponse([], mockChatId, mockUser);
      const yieldedItems: any[] = [];
      for await (const item of generator) {
        yieldedItems.push(item);
      }

      const userInternalMsg = yieldedItems.find(
        (y) =>
          y.type === 'internal_message' &&
          y.data.role === SenderRoleEnum.USER,
      );
      expect(userInternalMsg).toBeDefined();
      expect(
        userInternalMsg.data.toolData.functionResponses[0].response.error,
      ).toContain('Stream tool crash');

      const finalChunk = yieldedItems.find(
        (y) =>
          y.type === 'text_chunk' &&
          y.data === 'Tool failed but stream recovered.',
      );
      expect(finalChunk).toBeDefined();
    });
  });
});
