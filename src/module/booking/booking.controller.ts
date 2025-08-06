import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { Auth } from 'src/decorators/auth.decorator';
import { AuthType } from '../auth/enums/auth-type.enum';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dtos/create-booking.dto';
import { GetUserBookingDto } from './dtos/get-user-booking.dto';
import { User } from 'src/decorators/user.decorator';
import { UserInterface } from '../users/interfaces/user.interface';
import { Roles } from 'src/decorators/roles.decorator';
import { UserRole } from '../users/enum/user-role.enum';

@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Auth(AuthType.None)
  @Post()
  async create(@Body() createBookingDto: CreateBookingDto) {
    return this.bookingService.create(createBookingDto);
  }

  @Post('my-booking')
  async createMyBooking(
    @Body() createBookingDto: CreateBookingDto,
    @User() user: UserInterface,
  ) {
    createBookingDto.userId = user.sub;
    return this.bookingService.createMyBooking(createBookingDto);
  }

  @Roles(UserRole.Staff)
  @Get('user/:id')
  async getUserBooking(
    @Param('id') id: string,
    @Query() getUserBookingDto: GetUserBookingDto,
  ) {
    return this.bookingService.getUserBooking(id, getUserBookingDto);
  }

  @Get('my-booking')
  async getMyBooking(
    @Query() getUserBookingDto: GetUserBookingDto,
    @User() user: UserInterface,
  ) {
    return this.bookingService.getUserBooking(user.sub, getUserBookingDto);
  }

  @Auth(AuthType.None)
  @Post(':id')
  async cancelBooking(@Param('id') id: string) {
    return this.bookingService.cancelBooking(id);
  }
}
