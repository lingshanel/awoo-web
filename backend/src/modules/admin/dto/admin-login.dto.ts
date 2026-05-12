import { IsString, MaxLength, MinLength } from 'class-validator';

export class AdminLoginDto {
  @IsString()
  @MinLength(2, { message: '아이디는 2자 이상 입력해 주세요.' })
  @MaxLength(40, { message: '아이디는 40자 이하로 입력해 주세요.' })
  username!: string;

  @IsString()
  @MinLength(8, { message: '비밀번호는 8자 이상 입력해 주세요.' })
  @MaxLength(200, { message: '비밀번호는 200자 이하로 입력해 주세요.' })
  password!: string;
}
