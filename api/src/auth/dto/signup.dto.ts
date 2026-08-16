import { ApiProperty } from '@nestjs/swagger';
import {
  IsDefined,
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  Matches,
} from 'class-validator';

export class SignupDto {
  @ApiProperty({
    description: 'The unique username for the new account',
    example: 'johndoe',
  })
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  username: string;

  @ApiProperty({
    description: 'The display name for the user profile',
    example: 'John Doe',
  })
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  displayname: string;

  @ApiProperty({
    description: 'The email address for the new account',
    example: 'john.doe@example.com',
  })
  @IsDefined()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'The password for the new account',
    example: 'StrongPassword123!',
    minLength: 12,
  })
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @MinLength(12, { message: 'Password must be at least 12 characters long' })
  @Matches(/[a-z]/, {
    message: 'Password must contain at least one lowercase letter',
  })
  @Matches(/[A-Z]/, {
    message: 'Password must contain at least one uppercase letter',
  })
  @Matches(/[!@#$%^&*(),.?":{}|<>]/, {
    message: 'Password must contain at least one special character',
  })
  @Matches(/\d/, { message: 'Password must contain at least one number' })
  password: string;
}
