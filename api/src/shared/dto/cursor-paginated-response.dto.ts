import { ApiProperty } from '@nestjs/swagger';
import { CursorPaginationMetaDto } from './cursor-pagination-meta.dto';

export class CursorPaginatedResponseDto<T> {
  @ApiProperty({
    isArray: true,
    description: 'The list of items for the current page',
  })
  readonly data: T[];

  @ApiProperty({
    type: CursorPaginationMetaDto,
    description: 'Pagination metadata',
  })
  readonly meta: CursorPaginationMetaDto;

  constructor(data: T[], meta: CursorPaginationMetaDto) {
    this.data = data;
    this.meta = meta;
  }
}
