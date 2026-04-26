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
  @IsBoolean()
  isSage?: boolean = false;
}
