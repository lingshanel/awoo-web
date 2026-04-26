import { IsString, MaxLength, MinLength } from 'class-validator';

export class DeleteThreadDto {
  @IsString()
  @MinLength(4)
  @MaxLength(40)
  editPassword!: string;
}
