import { ApiPropertyOptional } from '@nestjs/swagger';

class UpdateMessageMetadataDto {
  @ApiPropertyOptional({
    enum: ['like', 'dislike'],
    description: 'User feedback on the message',
    nullable: true,
  })
  feedback?: 'like' | 'dislike' | null;
}

export class UpdateMessageDto {
  @ApiPropertyOptional({ description: 'The updated content of the message' })
  content?: string;

  @ApiPropertyOptional({
    type: UpdateMessageMetadataDto,
    description: 'Updated metadata for the message',
  })
  metadata?: UpdateMessageMetadataDto;
}
