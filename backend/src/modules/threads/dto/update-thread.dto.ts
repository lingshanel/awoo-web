import { IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateThreadDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  content!: string;

  @IsString()
  @MinLength(4)
  @MaxLength(40)
  editPassword!: string;

  @IsString()
  captchaToken!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(20)
  captchaAnswer!: string;
}
