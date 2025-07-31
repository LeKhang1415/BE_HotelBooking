import { IsEmail, IsNotEmpty } from 'class-validator';

export class LogInUserDto {
  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsEmail()
  email: string;

  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  password: string;
}
