import { IntersectionType } from '@nestjs/mapped-types';
import { IsOptional } from 'class-validator';
import { PaginationQueryDto } from 'src/common/pagination/dtos/pagination-query.dto';

class GetTypeRoomBaseDto {
  @IsOptional()
  maxPeople?: number;

  @IsOptional()
  sizeRoom?: number;

  @IsOptional()
  maxSize?: number;
}

export class GetTypeRoomDto extends IntersectionType(
  GetTypeRoomBaseDto,
  PaginationQueryDto,
) {}
