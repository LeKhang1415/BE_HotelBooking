import { Body, Controller, Post } from '@nestjs/common';
import { Auth } from 'src/decorators/auth.decorator';
import { AuthType } from '../auth/enums/auth-type.enum';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dtos/create-booking.dto';

@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Auth(AuthType.None)
  @Post()
  async create(@Body() createBookingDto: CreateBookingDto) {
    return this.bookingService.create(createBookingDto);
  }
}
