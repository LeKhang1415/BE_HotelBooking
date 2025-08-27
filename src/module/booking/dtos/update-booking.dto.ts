import { PartialType } from '@nestjs/mapped-types';
import { CreateBookingDto, CreateMyBookingDto } from './create-booking.dto';

export class UpdateBookingDto extends PartialType(CreateBookingDto) {}

export class UpdateMyBookingDto extends PartialType(CreateMyBookingDto) {}
