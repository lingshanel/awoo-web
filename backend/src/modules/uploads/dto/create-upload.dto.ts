import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateUploadDto {
  @IsString()
  @MaxLength(255)
  originalName!: string;

  @IsString()
  @MaxLength(100)
  mimeType!: string;

  @IsInt()
  @Min(1)
  size!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  width?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  height?: number;
}
