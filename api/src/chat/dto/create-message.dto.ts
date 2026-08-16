import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SenderRoleEnum } from '../enums/sender-role.enum';

export class ChatRecipeMetadataDto {
  @ApiProperty({
    description: 'The unique identifier of the recipe',
    example: 'uuid-123',
  })
  id: string;

  @ApiProperty({
    description: 'The title of the recipe',
    example: 'Pasta Carbonara',
  })
  title: string;

  @ApiPropertyOptional({
    description: 'The rating of the recipe',
    example: 4.8,
  })
  rating?: number;

  @ApiPropertyOptional({
    description: 'The Cloudinary ID of the recipe cover image',
  })
  coverImageId?: string;

  @ApiPropertyOptional({
    description: 'The cooking time in minutes',
    example: 30,
  })
  cookTime?: number;

  @ApiPropertyOptional({
    description: 'The difficulty level of the recipe',
    example: 'easy',
  })
  difficulty?: 'easy' | 'medium' | 'hard';

  @ApiPropertyOptional({
    description: 'A brief description of the recipe',
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'The category of the recipe',
    example: 'Вечеря',
  })
  category?: string;
}

export class ChatMessageMetadataDto {
  @ApiPropertyOptional({
    type: [ChatRecipeMetadataDto],
    description: 'List of recipes mentioned in the message',
  })
  recipes?: ChatRecipeMetadataDto[];

  @ApiPropertyOptional({
    enum: ['like', 'dislike'],
    description: 'User feedback on the message',
    nullable: true,
  })
  feedback?: 'like' | 'dislike' | null;

  @ApiPropertyOptional({
    description: 'Whether the message represents an error',
  })
  isError?: boolean;

  @ApiPropertyOptional({
    description: 'Flag to display the user\'s current dietary preferences in the chat UI',
  })
  showDiets?: boolean;

  @ApiPropertyOptional({
    description: 'Flag to display the user\'s current allergen list in the chat UI',
  })
  showAllergies?: boolean;
}

export class CreateMessageDto {
  @ApiProperty({
    enum: SenderRoleEnum,
    description: 'The role of the message sender',
  })
  role: SenderRoleEnum;

  @ApiProperty({
    description: 'The content of the message',
    example: 'Hello, I need a recipe for pasta.',
  })
  content: string;

  @ApiPropertyOptional({
    type: ChatMessageMetadataDto,
    description: 'Additional metadata for the message',
  })
  metadata?: ChatMessageMetadataDto;

  @ApiPropertyOptional({
    description: 'Whether this is an internal tool-call message (hidden from UI)',
  })
  isInternal?: boolean;

  @ApiPropertyOptional({
    description: 'Tool call/response data for context reconstruction',
  })
  toolData?: {
    modelParts?: any[];
    functionResponses?: Array<{ name: string; response: any }>;
  };
}
