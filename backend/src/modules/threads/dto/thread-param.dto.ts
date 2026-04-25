import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class ThreadParamDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id!: number;
}
