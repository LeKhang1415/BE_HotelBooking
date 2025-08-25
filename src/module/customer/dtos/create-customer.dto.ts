import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  @IsNotEmpty({ message: 'Họ và tên không được để trống' })
  fullName: string;

  @IsString()
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @Matches(/^(0|\+84)([0-9]{9})$/, {
    message: 'Số điện thoại không hợp lệ',
  })
  phone: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email?: string;

  @IsString()
  @IsNotEmpty({ message: 'CMND/CCCD không được để trống' })
  @Length(9, 12, { message: 'CMND/CCCD phải có từ 9 đến 12 số' })
  @Matches(/^[0-9]+$/, { message: 'CMND/CCCD chỉ được chứa số' })
  identityCard: string;
}
