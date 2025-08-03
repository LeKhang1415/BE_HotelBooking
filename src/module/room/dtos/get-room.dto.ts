import { IsEnum, IsIn, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { RoomStatus } from '../enums/room-status.enum';
import { PaginationQueryDto } from 'src/common/pagination/dtos/pagination-query.dto';
import { IntersectionType } from '@nestjs/mapped-types';

class RoomBaseDto {
  @IsOptional()
  @IsString()
  typeRoomId?: string;

  @IsOptional()
  @IsEnum(RoomStatus)
  status?: RoomStatus;

  @IsOptional()
  @IsNumber()
  minPrice?: number;

  @IsOptional()
  @IsNumber()
  maxPrice?: number;

  @IsOptional()
  @IsIn(['hour', 'day'])
  priceType?: 'hour' | 'day';
}

export class GetRoomDto extends IntersectionType(
  RoomBaseDto,
  PaginationQueryDto,
) {}
