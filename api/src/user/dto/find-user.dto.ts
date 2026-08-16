import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class FindUserDto {
  @ApiPropertyOptional({
    description: 'Filter by user ID',
    example: 'uuid-123',
  })
  @IsString()
  @IsOptional()
  id?: string;

  @ApiPropertyOptional({
    description: 'Filter by username',
    example: 'johndoe',
  })
  @IsString()
  @IsOptional()
  username?: string;

  @ApiPropertyOptional({
    description: 'Filter by email',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsOptional()
  email?: string;
}
