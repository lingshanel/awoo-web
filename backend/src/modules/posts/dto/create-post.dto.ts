import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreatePostDto {
  @IsOptional()
  @IsString()
  @MaxLength(20)
  authorName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  email?: string;

  @IsString()
  @MinLength(4)
  @MaxLength(40)
  editPassword!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  parentPostId?: number;

  @IsString()
  @MinLength(1)
  @MaxLength(3000)
  content!: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(4)
  @IsInt({ each: true })
  attachmentIds?: number[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(4)
  @IsString({ each: true })
  @MaxLength(256, { each: true })
  attachmentDeleteTokens?: string[];

  @IsOptional()
  @IsBoolean()
  isSage?: boolean = false;

  @IsString()
  @MinLength(4)
  @MaxLength(512)
  captchaToken!: string;

  @IsString()
  @MinLength(4)
  @MaxLength(16)
  captchaAnswer!: string;
}
