import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateRecipeReviewCommentDto {
  @ApiProperty({
    description: 'The text of the comment',
    example: 'Thanks for the great recipe!',
  })
  @IsString()
  @IsNotEmpty()
  text: string;
}
