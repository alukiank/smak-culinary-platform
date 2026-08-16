import { ApiProperty } from '@nestjs/swagger';

export class CursorPaginationMetaDto {
  @ApiProperty({
    description: 'The cursor for the next page',
    example: 'abc123next',
    nullable: true,
  })
  readonly nextCursor: string | null;

  @ApiProperty({ description: 'Whether there is a next page', example: true })
  readonly hasNextPage: boolean;

  @ApiProperty({
    description: 'The maximum number of items requested',
    example: 15,
  })
  readonly limit: number;

  @ApiProperty({
    description: 'The number of items in the current response',
    example: 15,
  })
  readonly itemCount: number;

  constructor(
    nextCursor: string | null,
    hasNextPage: boolean,
    limit: number,
    count: number,
  ) {
    this.nextCursor = nextCursor;
    this.hasNextPage = hasNextPage;
    this.limit = limit;
    this.itemCount = count;
  }
}
