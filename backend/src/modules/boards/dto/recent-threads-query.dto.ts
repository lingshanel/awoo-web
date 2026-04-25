import { IsIn, IsOptional } from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

export class RecentThreadsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(['latest', 'popular', 'views'])
  sort?: 'latest' | 'popular' | 'views' = 'latest';
}
