import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { Auth } from 'src/decorators/auth.decorator';
import { AuthType } from '../auth/enums/auth-type.enum';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dtos/create-booking.dto';
import { GetUserBookingDto } from './dtos/get-user-booking.dto';

@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Auth(AuthType.None)
  @Post()
  async create(@Body() createBookingDto: CreateBookingDto) {
    return this.bookingService.create(createBookingDto);
  }

  @Auth(AuthType.None)
  @Get(':id')
  async getUserBooking(
    @Param('id') id: string,
    @Query() getUserBookingDto: GetUserBookingDto,
  ) {
    return this.bookingService.getUserBooking(id, getUserBookingDto);
  }
}
