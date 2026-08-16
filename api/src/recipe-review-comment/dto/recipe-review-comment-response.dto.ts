import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { UserPublicDto } from '../../user/dto/user-public.dto';

export class RecipeReviewCommentResponseDto {
  @ApiProperty({
    description: 'The unique identifier of the comment',
    example: 'uuid-123',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'The text of the comment',
    example: 'Very helpful!',
  })
  @Expose()
  text: string;

  @ApiProperty({ description: 'When the comment was created' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'When the comment was last updated' })
  @Expose()
  updatedAt: Date;

  @ApiProperty({
    description: 'The user who wrote the comment',
    type: () => UserPublicDto,
  })
  @Expose()
  @Type(() => UserPublicDto)
  user: UserPublicDto;
}
