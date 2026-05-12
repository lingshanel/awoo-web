import { IsString, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @MinLength(8, { message: '현재 비밀번호는 8자 이상 입력해 주세요.' })
  @MaxLength(200, { message: '현재 비밀번호는 200자 이하로 입력해 주세요.' })
  currentPassword!: string;

  @IsString()
  @MinLength(12, { message: '새 비밀번호는 12자 이상 입력해 주세요.' })
  @MaxLength(200, { message: '새 비밀번호는 200자 이하로 입력해 주세요.' })
  newPassword!: string;
}
