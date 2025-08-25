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
import { StayType } from '../enums/stay-type';
import { BookingType } from '../enums/booking-type';

export class CreateBookingDto {
  @IsDate({ message: 'Thời gian bắt đầu không hợp lệ' })
  startTime: Date;

  @IsDate({ message: 'Thời gian kết thúc không hợp lệ' })
  endTime: Date;

  @IsEnum(StayType, { message: 'Loại lưu trú không hợp lệ' })
  stayType: StayType;

  @IsNumber()
  @Min(1, { message: 'Số lượng khách phải lớn hơn hoặc bằng 1' })
  numberOfGuest: number;

  @IsUUID()
  roomId: string;

  @IsNotEmpty()
  @IsEnum(BookingType)
  bookingType: BookingType;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsString()
  @IsNotEmpty({ message: 'Họ tên khách hàng không được để trống' })
  customerFullName: string;

  @IsString()
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @Matches(/^(0|\+84)([0-9]{9})$/, {
    message: 'Số điện thoại không hợp lệ',
  })
  customerPhone: string;

  @IsEmail({}, { message: 'Email không hợp lệ' })
  customerEmail: string;

  @IsString()
  @IsNotEmpty({ message: 'CMND/CCCD không được để trống' })
  @Length(9, 12, { message: 'CMND/CCCD phải có từ 9 đến 12 số' })
  @Matches(/^[0-9]+$/, { message: 'CMND/CCCD chỉ được chứa số' })
  customerIdentityCard: string;
}
