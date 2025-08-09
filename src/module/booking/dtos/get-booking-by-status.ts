import { IsEnum } from 'class-validator';
import { BookingStatus } from '../enums/booking-status';
import { IntersectionType } from '@nestjs/mapped-types';
import { PaginationQueryDto } from 'src/common/pagination/dtos/pagination-query.dto';

class GetBookingByStatusBaseDto {
  @IsEnum(BookingStatus)
  status: BookingStatus;
}

export class GetBookingByStatusDto extends IntersectionType(
  PaginationQueryDto,
  GetBookingByStatusBaseDto,
) {}
