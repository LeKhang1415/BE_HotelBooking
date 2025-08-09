import { IntersectionType } from '@nestjs/mapped-types';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { PaginationQueryDto } from 'src/common/pagination/dtos/pagination-query.dto';

export class GetReviewBaseDto {
  @IsOptional()
  @IsString()
  roomId?: string;

  @IsOptional()
  @IsInt()
  userId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsString()
  sortBy?: 'createdAt' | 'rating' = 'createdAt';

  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

export class GetReviewDto extends IntersectionType(
  GetReviewBaseDto,
  PaginationQueryDto,
) {}
