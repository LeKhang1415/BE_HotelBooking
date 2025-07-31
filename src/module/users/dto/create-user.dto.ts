import { IsEmail, IsNotEmpty, Length } from 'class-validator';
import { UserRole } from '../enum/userRole.enum';

export class CreateUserDto {
  @Length(1, 50, { message: 'Tên quá dài (tối đa 50 ký tự)' })
  name: string;

  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @Length(6, 20, { message: 'Mật khẩu phải từ 6 đến 20 ký tự' })
  password: string;

  @IsNotEmpty({ message: 'Vai trò người dùng không được để trống' })
  role: UserRole;
}
