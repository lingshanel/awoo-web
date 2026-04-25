import { IsIn, IsOptional } from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

export class ThreadPostsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(['latest', 'oldest', 'likes'])
  sort?: 'latest' | 'oldest' | 'likes' = 'oldest';
}
