import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';

export class UpdateChatDto {
  @ApiPropertyOptional({
    description: 'The updated title of the chat',
    example: 'My Favorite Recipes',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({
    description: 'Whether the chat is archived',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;

  @ApiPropertyOptional({
    description: 'A summary of the chat content',
  })
  @IsOptional()
  @IsString()
  summary?: string;
}
