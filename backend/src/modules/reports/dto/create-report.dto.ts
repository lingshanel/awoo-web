import { IsIn, IsString, MaxLength } from 'class-validator';

export class CreateReportDto {
  @IsIn(['thread', 'post'])
  targetType!: 'thread' | 'post';

  @IsString()
  @MaxLength(1000)
  reason!: string;
}
