import { IntersectionType } from '@nestjs/mapped-types';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from 'src/common/pagination/dtos/pagination-query.dto';

class ListConversationsBaseDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;
}

export class ListConversationsDto extends IntersectionType(
  PaginationQueryDto,
  ListConversationsBaseDto,
) {}
