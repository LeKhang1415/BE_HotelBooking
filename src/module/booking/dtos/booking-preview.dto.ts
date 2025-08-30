import {
  IsEnum,
  IsNotEmpty,
  IsUUID,
  IsInt,
  Min,
  IsDate,
  IsOptional,
} from 'class-validator';
import { StayType } from '../enums/stay-type';

export class BookingPreviewDto {
  @IsUUID()
  @IsNotEmpty()
  roomId: string;

  @IsDate({ message: 'Thời gian bắt đầu không hợp lệ' })
  startTime: Date;

  @IsDate({ message: 'Thời gian kết thúc không hợp lệ' })
  endTime: Date;

  @IsEnum(StayType)
  @IsNotEmpty()
  stayType: StayType;

  @IsInt()
  @Min(1)
  numberOfGuest: number;

  // Validate khi update
  @IsUUID()
  @IsOptional()
  bookingId?: string;
}
