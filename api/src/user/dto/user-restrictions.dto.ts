import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class UserRestrictionsDto {
  @ApiProperty({
    description: 'List of user allergies',
    type: [String],
    example: ['Shellfish', 'Nuts'],
  })
  @Expose()
  allergies: string[];

  @ApiProperty({
    description: 'List of user dietary preferences',
    type: [String],
    example: ['Vegetarian', 'Gluten-Free'],
  })
  @Expose()
  dietary: string[];
}
