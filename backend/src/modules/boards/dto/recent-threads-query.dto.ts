import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

export class RecentThreadsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(['latest', 'popular', 'views'])
  sort?: 'latest' | 'popular' | 'views' = 'latest';

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsIn(['all', 'images'])
  media?: 'all' | 'images' = 'all';
}
