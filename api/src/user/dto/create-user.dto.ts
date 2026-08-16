import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { UserRoleEnum } from '../enums/user-role.enum';

export class CreateUserDto {
  @ApiProperty({
    description: 'The unique username for the user',
    example: 'johndoe',
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    description: 'The display name for the user',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  displayname: string;

  @ApiProperty({
    description: 'The email address of the user',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'The password for the user account',
    example: 'StrongPassword123!',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({
    description: 'The role of the user',
    enum: UserRoleEnum,
    example: UserRoleEnum.USER,
  })
  @IsEnum(UserRoleEnum)
  @IsOptional()
  role?: UserRoleEnum;

  @ApiPropertyOptional({
    description: 'Dietary preferences',
    example: ['Vegan', 'Gluten-Free'],
    isArray: true,
  })
  @IsString({ each: true })
  @IsOptional()
  dietary?: string[];

  @ApiPropertyOptional({
    description: 'User allergies',
    example: ['Peanuts', 'Dairy'],
    isArray: true,
  })
  @IsString({ each: true })
  @IsOptional()
  allergies?: string[];
}
