import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, IsUUID } from 'class-validator';

export class CreateChatDto {
  @ApiPropertyOptional({
    description: 'The title of the chat',
    example: 'Healthy Dinner Ideas',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  title?: string;

  @ApiPropertyOptional({
    description: 'The recipe ID linked to the chat, if any',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  recipeId?: string;
}
