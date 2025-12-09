import { ApiProperty } from '@nestjs/swagger';
import { Page } from '@devlab-io/nest-auth-types';

export class PageDto<T> implements Page<T> {
  @ApiProperty({
    description: 'Page contents',
    type: 'array',
    isArray: true,
  })
  contents: T[];

  @ApiProperty({
    example: 1,
    description: 'Page number',
  })
  page: number;

  @ApiProperty({
    example: 10,
    description: 'Number of pages',
  })
  pages: number;

  @ApiProperty({
    example: 10,
    description: 'Page size',
  })
  size: number;

  @ApiProperty({
    example: 100,
    description: 'Total number of items',
  })
  total: number;
}
