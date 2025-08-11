import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from 'src/common/pagination/dtos/pagination-query.dto';
import { IntersectionType } from '@nestjs/mapped-types';

class GetUserBaseDto {
  @IsOptional()
  @IsString()
  keyword?: string = '';
}

export class GetUserDto extends IntersectionType(
  GetUserBaseDto,
  PaginationQueryDto,
) {}
