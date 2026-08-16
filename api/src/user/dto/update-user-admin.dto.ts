import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { UserRoleEnum } from '../../user/enums/user-role.enum';

export class UpdateUserAdminDto {
  @ApiPropertyOptional({
    description: 'The updated display name of the user',
    example: 'Jane Doe',
  })
  @IsString()
  @IsOptional()
  displayname?: string;

  @ApiPropertyOptional({
    description: 'The updated role of the user',
    enum: UserRoleEnum,
    example: UserRoleEnum.ADMIN,
  })
  @IsOptional()
  @IsEnum(UserRoleEnum)
  role?: UserRoleEnum;

  @ApiPropertyOptional({
    description: 'Whether the user is banned',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isBanned?: boolean;
}
