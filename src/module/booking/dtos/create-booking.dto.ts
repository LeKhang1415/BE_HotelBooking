import {
  IsEnum,
  IsUUID,
  IsNumber,
  Min,
  IsOptional,
  IsDate,
  IsNotEmpty,
  IsString,
  IsEmail,
  Matches,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BookingType } from '../enums/booking-type';
import { StayType } from '../enums/stay-type';

// Base DTO chứa các field chung
export class BaseBookingDto {
  @IsUUID()
  roomId: string;

  @IsDate({ message: 'Thời gian bắt đầu không hợp lệ' })
  startTime: Date;
  @IsDate({ message: 'Thời gian kết thúc không hợp lệ' })
  endTime: Date;

  @IsEnum(StayType, { message: 'Loại lưu trú không hợp lệ' })
  stayType: StayType;

  @IsNumber({}, { message: 'Số lượng khách phải là số' })
  @Min(1, { message: 'Số lượng khách phải lớn hơn hoặc bằng 1' })
  numberOfGuest: number;

  @IsString()
  @IsNotEmpty({ message: 'Họ tên khách hàng không được để trống' })
  customerFullName: string;

  @IsString()
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @Matches(/^(0|\+84)([0-9]{9})$/, {
    message: 'Số điện thoại không hợp lệ',
  })
  customerPhone: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email không hợp lệ' })
  customerEmail?: string;

  @IsOptional()
  @IsString()
  @Length(9, 12, { message: 'CMND/CCCD phải có từ 9 đến 12 số' })
  @Matches(/^[0-9]+$/, { message: 'CMND/CCCD chỉ được chứa số' })
  customerIdentityCard?: string;

  @IsUUID()
  @IsOptional()
  userId?: string;
}

// CreateBookingDto extends Base và thêm bookingType
export class CreateBookingDto extends BaseBookingDto {
  @IsNotEmpty()
  @IsEnum(BookingType, { message: 'Loại booking không hợp lệ' })
  bookingType: BookingType;
}

export class CreateMyBookingDto extends BaseBookingDto {}
