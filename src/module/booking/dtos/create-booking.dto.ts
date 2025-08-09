import {
  IsEnum,
  IsUUID,
  IsNumber,
  Min,
  IsOptional,
  IsDate,
} from 'class-validator';
import { StayType } from '../enums/stay-type';

export class CreateBookingDto {
  @IsDate()
  startTime: Date;

  @IsDate()
  endTime: Date;

  @IsEnum(StayType)
  stayType: StayType;

  @IsNumber()
  @Min(1)
  numberOfGuest: number;

  @IsUUID()
  roomId: string;

  @IsOptional()
  @IsUUID()
  userId?: string; // Optional
}
