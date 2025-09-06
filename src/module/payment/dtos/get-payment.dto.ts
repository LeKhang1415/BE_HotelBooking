import { IsOptional, IsEnum, IsUUID } from 'class-validator';
import { PaymentStatus } from '../enums/payment-status.enum';
import { PaymentMethod } from '../enums/payment-method.enum';
import { PaymentType } from '../enums/payment-type.enum';
import { PaginationQueryDto } from 'src/common/pagination/dtos/pagination-query.dto';
import { IntersectionType } from '@nestjs/mapped-types';

export class GetAllPaymentBaseDto {
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @IsOptional()
  @IsEnum(PaymentMethod)
  method?: PaymentMethod;

  @IsOptional()
  @IsEnum(PaymentType)
  type?: PaymentType;

  @IsOptional()
  @IsUUID()
  bookingId?: string;
}
export class GetAllPaymentDto extends IntersectionType(
  PaginationQueryDto,
  GetAllPaymentBaseDto,
) {}
