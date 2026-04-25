import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateThreadDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  boardSlug!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  authorName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  email?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  content!: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(4)
  @IsInt({ each: true })
  attachmentIds?: number[];

  @IsOptional()
  @IsBoolean()
  isSage?: boolean = false;

  @IsOptional()
  @IsBoolean()
  hasSpoiler?: boolean = false;

  @IsOptional()
  @IsBoolean()
  hasNsfw?: boolean = false;

  @IsString()
  @MinLength(4)
  @MaxLength(16)
  captchaToken!: string;

  @IsString()
  @MinLength(4)
  @MaxLength(16)
  captchaAnswer!: string;
}
