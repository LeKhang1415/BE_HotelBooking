import {
  IsEnum,
  IsNotEmpty,
  IsUUID,
  IsDateString,
  IsNumber,
  Min,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TypeBooking } from '../enums/typeBooking';

export class CreateBookingDto {
  @IsNotEmpty()
  @IsDateString()
  startTime: string;

  @IsNotEmpty()
  @IsDateString()
  endTime: string;

  @IsEnum(TypeBooking)
  bookingType: TypeBooking;

  @IsNumber()
  @Min(1)
  numberOfGuest: number;

  @IsUUID()
  roomId: string;

  @IsOptional()
  @IsUUID()
  userId?: string; // Optional for guest bookings
}
