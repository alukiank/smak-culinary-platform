import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'The updated username',
    example: 'johndoe_updated',
  })
  @IsString()
  @IsOptional()
  username?: string;

  @ApiPropertyOptional({
    description: 'The updated display name',
    example: 'John Doe Updated',
  })
  @IsString()
  @IsOptional()
  displayname?: string;

  @ApiPropertyOptional({
    description: 'The updated email address',
    example: 'john.updated@example.com',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    description: 'Updated dietary preferences',
    example: ['Vegetarian'],
    isArray: true,
  })
  @IsString({ each: true })
  @IsOptional()
  dietary?: string[];

  @ApiPropertyOptional({
    description: 'Updated user allergies',
    example: ['Shellfish'],
    isArray: true,
  })
  @IsString({ each: true })
  @IsOptional()
  allergies?: string[];
}
