import {
  IsEnum,
  IsNotEmpty,
  IsUUID,
  IsDateString,
  IsNumber,
  Min,
  IsOptional,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TypeBooking } from '../enums/typeBooking';

export class CreateBookingDto {
  @IsDate()
  startTime: Date;

  @IsDate()
  endTime: Date;

  @IsEnum(TypeBooking)
  bookingType: TypeBooking;

  @IsNumber()
  @Min(1)
  numberOfGuest: number;

  @IsUUID()
  roomId: string;

  @IsOptional()
  @IsUUID()
  userId?: string; // Optional
}
