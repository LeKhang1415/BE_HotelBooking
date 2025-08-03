import { IsIn, IsNumber, IsOptional, IsString, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { IntersectionType } from '@nestjs/mapped-types';
import { PaginationQueryDto } from 'src/common/pagination/dtos/pagination-query.dto';

class FindAvailableRoomBaseDto {
  @IsOptional()
  @IsString()
  typeRoomId?: string;

  @IsOptional()
  @IsNumber()
  minPrice?: number;

  @IsOptional()
  @IsNumber()
  maxPrice?: number;

  @IsOptional()
  @IsIn(['hour', 'day'])
  priceType?: 'hour' | 'day';

  @Type(() => Date)
  @IsDate()
  startTime: Date;

  @Type(() => Date)
  @IsDate()
  endTime: Date;
}

export class FindAvailableRoomDto extends IntersectionType(
  FindAvailableRoomBaseDto,
  PaginationQueryDto,
) {}
