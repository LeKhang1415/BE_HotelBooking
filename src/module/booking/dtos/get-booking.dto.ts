import {
  IsOptional,
  IsEnum,
  IsDateString,
  IsUUID,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BookingStatus } from '../enums/booking-status';
import { BookingType } from '../enums/booking-type';
import { StayType } from '../enums/stay-type';
import { PaginationQueryDto } from 'src/common/pagination/dtos/pagination-query.dto';
import { IntersectionType } from '@nestjs/mapped-types';

export class GetAllBookingBaseDto {
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @IsOptional()
  @IsEnum(BookingType)
  bookingType?: BookingType;

  @IsOptional()
  @IsEnum(StayType)
  stayType?: StayType;

  @IsOptional()
  @IsUUID()
  roomId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @Type(() => Date)
  bookingDateFrom?: Date;

  @IsOptional()
  @Type(() => Date)
  bookingDateTo?: Date;

  @IsOptional()
  @IsString()
  search?: string;
}

export class GetAllBookingDto extends IntersectionType(
  PaginationQueryDto,
  GetAllBookingBaseDto,
) {}
