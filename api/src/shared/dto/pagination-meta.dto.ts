import { ApiProperty } from '@nestjs/swagger';

export class PaginationMetaDto {
  @ApiProperty({
    description: 'The total number of items available',
    example: 100,
  })
  readonly totalItems: number;

  @ApiProperty({
    description: 'The number of items in the current response',
    example: 10,
  })
  readonly itemCount: number;

  @ApiProperty({ description: 'The number of items per page', example: 10 })
  readonly itemsPerPage: number;

  @ApiProperty({ description: 'The total number of pages', example: 10 })
  readonly totalPages: number;

  @ApiProperty({ description: 'The current page number', example: 1 })
  readonly currentPage: number;

  constructor(totalItems: number, page: number, limit: number, count: number) {
    this.totalItems = totalItems;
    this.itemCount = count;
    this.itemsPerPage = limit;
    this.totalPages = Math.ceil(totalItems / limit);
    this.currentPage = page;
  }
}
