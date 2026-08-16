import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { UserRoleEnum } from '../enums/user-role.enum';
import { PaginationDto } from '../../shared/dto/pagination.dto';

export class UserSearchAdminDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Text search by username, email or displayname',
    example: 'john',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'User role filter',
    enum: UserRoleEnum,
    example: UserRoleEnum.ADMIN,
  })
  @IsOptional()
  @IsEnum(UserRoleEnum)
  role?: UserRoleEnum;

  @ApiPropertyOptional({
    description: 'Ban status filter',
    example: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isBanned?: boolean;

  @ApiPropertyOptional({
    description: 'Verification status filter',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isVerified?: boolean;
}
