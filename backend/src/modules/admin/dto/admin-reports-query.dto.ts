import { IsIn, IsOptional } from 'class-validator';

export class AdminReportsQueryDto {
  @IsOptional()
  @IsIn(['all', 'pending', 'resolved', 'reviewed', 'rejected'])
  status?: 'all' | 'pending' | 'resolved' | 'reviewed' | 'rejected' = 'pending';
}
