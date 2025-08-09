import { IsEnum, IsOptional } from 'class-validator';
import { BookingStatus } from '../enums/booking-status';
import { IntersectionType } from '@nestjs/mapped-types';
import { PaginationQueryDto } from 'src/common/pagination/dtos/pagination-query.dto';

class GetUserBookingBaseDto {
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;
}

export class GetUserBookingDto extends IntersectionType(
  PaginationQueryDto,
  GetUserBookingBaseDto,
) {}
