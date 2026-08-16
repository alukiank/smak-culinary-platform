import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCollectionDto {
  @ApiProperty({ example: 'Summer BBQ', description: 'Name of the collection' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    example: 'My favorite summer recipes',
    description: 'Description of the collection',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}
