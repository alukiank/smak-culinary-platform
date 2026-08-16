import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { UserRoleEnum } from '../../user/enums/user-role.enum';

export class UserPrivateDto {
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
    description: 'The email address of the user',
    example: 'john.doe@example.com',
  })
  @Expose()
  email: string;

  @ApiProperty({
    description: 'The role of the user',
    enum: UserRoleEnum,
    example: UserRoleEnum.USER,
  })
  @Expose()
  role: UserRoleEnum;

  @ApiProperty({ description: 'Whether the user is banned', example: false })
  @Expose()
  isBanned: boolean;

  @ApiProperty({
    description: 'Whether the user email is verified',
    example: true,
  })
  @Expose()
  isVerified: boolean;
}
