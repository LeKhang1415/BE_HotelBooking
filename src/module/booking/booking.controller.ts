import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dtos/create-booking.dto';
import { GetUserBookingDto } from './dtos/get-user-booking.dto';
import { User } from 'src/decorators/user.decorator';
import { UserInterface } from '../users/interfaces/user.interface';
import { Roles } from 'src/decorators/roles.decorator';
import { UserRole } from '../users/enum/user-role.enum';
import { PaginationQueryDto } from 'src/common/pagination/dtos/pagination-query.dto';
import { GetBookingByStatusDto } from './dtos/get-booking-by-status';
import { GetAllBookingDto } from './dtos/get-booking.dto';

@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Roles(UserRole.Staff)
  @Get('all')
  async getAllBooking(@Query() getAllBookingDto: GetAllBookingDto) {
    return this.bookingService.getAllBooking(getAllBookingDto);
  }

  @Roles(UserRole.Staff)
  @Get('/find-by-status')
  async findBookingByStatus(
    @Query() getBookingByStatusDto: GetBookingByStatusDto,
  ) {
    return await this.bookingService.findBookingByStatus(getBookingByStatusDto);
  }

  @Roles(UserRole.Staff)
  @Post()
  async create(@Body() createBookingDto: CreateBookingDto) {
    return this.bookingService.create(createBookingDto);
  }

  @Roles(UserRole.Staff)
  @Get(`/:bookingId`)
  async findOne(@Param('bookingId') bookingId: string) {
    return await this.bookingService.findOne(bookingId);
  }

  @Roles(UserRole.Staff)
  @Get('user/:id')
  async getUserBooking(
    @Param('id') id: string,
    @Query() getUserBookingDto: GetUserBookingDto,
  ) {
    return this.bookingService.getUserBooking(id, getUserBookingDto);
  }

  @Roles(UserRole.Staff)
  @Get('booking-today')
  async findBookingToday(@Query() paginationQueryDto: PaginationQueryDto) {
    return this.bookingService.findBookingToday(paginationQueryDto);
  }

  @Roles(UserRole.Staff)
  @Post('/reject-booking/:bookingId')
  async rejectBooking(@Param('bookingId') bookingId: string) {
    return this.bookingService.rejectBooking(bookingId);
  }

  @Post('my-booking')
  async createMyBooking(
    @Body() createBookingDto: CreateBookingDto,
    @User() user: UserInterface,
  ) {
    createBookingDto.userId = user.sub;
    return this.bookingService.createMyBooking(createBookingDto);
  }

  @Get('my-booking/:bookingId')
  async findMyBooking(
    @Param('bookingId') bookingId: string,
    @User() user: UserInterface,
  ) {
    return this.bookingService.findMyBooking(user.sub, bookingId);
  }

  @Get('my-booking')
  async getMyAllBooking(
    @Query() getUserBookingDto: GetUserBookingDto,
    @User() user: UserInterface,
  ) {
    return this.bookingService.getUserBooking(user.sub, getUserBookingDto);
  }

  @Post('/cancel-my-booking/:bookingId')
  async cancelMyBooking(
    @User() user: UserInterface,
    @Param('bookingId') bookingId: string,
  ) {
    return this.bookingService.cancelMyBooking(user.sub, bookingId);
  }
}
