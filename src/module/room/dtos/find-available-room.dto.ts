import { IsIn, IsNumber, IsOptional, IsDate, Min } from 'class-validator';
import { IntersectionType } from '@nestjs/mapped-types';
import { PaginationQueryDto } from 'src/common/pagination/dtos/pagination-query.dto';

class FindAvailableRoomBaseDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsIn(['hour', 'day'])
  priceType?: 'hour' | 'day';

  @IsOptional()
  @IsNumber()
  @Min(1)
  numberOfPeople?: number;

  @IsDate()
  startTime: Date;

  @IsDate()
  endTime: Date;
}

export class FindAvailableRoomDto extends IntersectionType(
  FindAvailableRoomBaseDto,
  PaginationQueryDto,
) {}
