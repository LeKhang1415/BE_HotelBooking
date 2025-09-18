import { IntersectionType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from 'src/common/pagination/dtos/pagination-query.dto';
import { BookingStatus } from '../enums/booking-status';

class FindCheckinCheckoutTodayBaseDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(BookingStatus, {
    message: 'status must be a valid BookingStatus',
  })
  status?: BookingStatus;
}

export class FindCheckinCheckoutTodayDto extends IntersectionType(
  PaginationQueryDto,
  FindCheckinCheckoutTodayBaseDto,
) {}
