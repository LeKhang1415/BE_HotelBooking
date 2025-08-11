import { IsEmail, IsOptional, Length } from 'class-validator';

export class UpdateCurrentUserDto {
  @IsOptional()
  @Length(1, 50, { message: 'Tên quá dài (tối đa 50 ký tự)' })
  name?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email?: string;
}
