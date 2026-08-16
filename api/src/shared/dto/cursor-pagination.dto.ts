import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CursorPaginationDto {
  @ApiPropertyOptional({
    description: 'The cursor for the current page',
    example: 'abc123current',
  })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({
    description: 'The maximum number of items to return',
    example: 15,
    default: 15,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 15;
}
