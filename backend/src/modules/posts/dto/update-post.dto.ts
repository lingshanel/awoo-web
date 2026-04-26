import { IsString, MaxLength, MinLength } from 'class-validator';

export class UpdatePostDto {
  @IsString()
  @MinLength(1)
  @MaxLength(3000)
  content!: string;

  @IsString()
  @MinLength(4)
  @MaxLength(40)
  editPassword!: string;
}
