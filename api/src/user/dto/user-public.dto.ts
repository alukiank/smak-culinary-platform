import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class UserPublicDto {
  @ApiProperty({
    description: 'The unique identifier of the user',
    example: 'uuid-123',
  })
  @Expose()
  id: string;

  @ApiProperty({ description: 'The username of the user', example: 'johndoe' })
  @Expose()
  username: string;

  @ApiProperty({
    description: 'The display name of the user',
    example: 'John Doe',
  })
  @Expose()
  displayname: string;

  @ApiProperty({
    description: 'Average rating of the author\'s recipes',
    example: 4.5,
    required: false,
  })
  @Expose()
  averageRating?: number;

  @ApiProperty({
    description: 'Total number of reviews received on the author\'s recipes',
    example: 12,
    required: false,
  })
  @Expose()
  totalReviews?: number;
}
