import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateBanDto {
  @IsIn(['AUTHOR_HASH', 'IP_HASH'])
  banType!: 'AUTHOR_HASH' | 'IP_HASH';

  @IsString()
  @MaxLength(128)
  valueHash!: string;

  @IsString()
  @MaxLength(1000)
  reason!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  expiresInHours?: number;
}
