import {
  IsEnum,
  IsIn,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';
import { RoomStatus } from '../enums/room-status.enum';
import { PaginationQueryDto } from 'src/common/pagination/dtos/pagination-query.dto';
import { IntersectionType } from '@nestjs/mapped-types';

class RoomBaseDto {
  @IsOptional()
  @IsEnum(RoomStatus)
  status?: RoomStatus;

  @IsOptional()
  @IsUUID()
  typeRoomId: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  numberOfPeople?: number;

  @IsOptional()
  @IsIn(['hour', 'day'])
  priceType?: 'hour' | 'day';
}

export class GetRoomDto extends IntersectionType(
  RoomBaseDto,
  PaginationQueryDto,
) {}
