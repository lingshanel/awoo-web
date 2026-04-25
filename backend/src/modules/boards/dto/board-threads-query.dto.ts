import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

export class BoardThreadsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(['latest', 'popular', 'views'])
  sort?: 'latest' | 'popular' | 'views' = 'latest';

  @IsOptional()
  @IsString()
  q?: string;
}
