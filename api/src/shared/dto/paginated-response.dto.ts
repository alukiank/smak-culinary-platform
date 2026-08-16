import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from './pagination-meta.dto';

export class PaginatedResponseDto<T> {
  @ApiProperty({
    isArray: true,
    description: 'The list of items for the current page',
  })
  readonly data: T[];

  @ApiProperty({ type: PaginationMetaDto, description: 'Pagination metadata' })
  readonly meta: PaginationMetaDto;

  constructor(data: T[], meta: PaginationMetaDto) {
    this.data = data;
    this.meta = meta;
  }
}
