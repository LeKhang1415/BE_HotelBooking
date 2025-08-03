import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional, IsDateString } from 'class-validator';
import { BookingStatus } from '../enums/bookingStatus';
import { CreateBookingDto } from './create-booking.dto';

export class UpdateBookingDto extends PartialType(CreateBookingDto) {
  @IsOptional()
  @IsEnum(BookingStatus)
  bookingStatus?: BookingStatus;

  @IsOptional()
  @IsDateString()
  actualCheckIn?: string;

  @IsOptional()
  @IsDateString()
  actualCheckOut?: string;
}
