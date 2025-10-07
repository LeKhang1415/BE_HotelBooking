import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  ParseUUIDPipe,
  ParseIntPipe,
} from '@nestjs/common';
import { BookingService } from './booking.service';
import {
  CreateBookingDto,
  CreateMyBookingDto,
} from './dtos/create-booking.dto';
import { GetUserBookingDto } from './dtos/get-user-booking.dto';
import { User } from 'src/decorators/user.decorator';
import { UserInterface } from '../users/interfaces/user.interface';
import { Roles } from 'src/decorators/roles.decorator';
import { UserRole } from '../users/enum/user-role.enum';
import { PaginationQueryDto } from 'src/common/pagination/dtos/pagination-query.dto';
import { GetBookingByStatusDto } from './dtos/get-booking-by-status';
import { GetAllBookingDto } from './dtos/get-booking.dto';
import { BookingPreviewDto } from './dtos/booking-preview.dto';
import {
  UpdateBookingDto,
  UpdateMyBookingDto,
} from './dtos/update-booking.dto';
import { FindCheckinCheckoutTodayDto } from './dtos/find-checkin-checkout-today.dto';

@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  // ==== PREVIEW BOOKING ====
  @Post('preview')
  async previewBooking(
    @Body() bookingPreviewDto: BookingPreviewDto,
    @Query('isUpdate') isUpdate?: string,
  ) {
    const isUpdateMode = isUpdate === 'true';
    return this.bookingService.previewBooking(bookingPreviewDto, isUpdateMode);
  }

  // ==== USER BOOKING ====

  @Get('my-booking/all')
  async getAllMyBooking(
    @Query() getUserBookingDto: GetUserBookingDto,
    @User() user: UserInterface,
  ) {
    return this.bookingService.getUserBooking(user.sub, getUserBookingDto);
  }
  @Post('my-booking')
  async createMyBooking(
    @Body() createMyBookingDto: CreateMyBookingDto,
    @User() user: UserInterface,
  ) {
    createMyBookingDto.userId = user.sub;
    return this.bookingService.createMyBooking(createMyBookingDto);
  }

  @Post('my-booking/:bookingId')
  async updateMyBooking(
    @Param('bookingId', new ParseUUIDPipe()) bookingId: string,
    @Body() updateMyBookingDto: UpdateMyBookingDto,
    @User() user: UserInterface,
  ) {
    return this.bookingService.updateMyBooking(
      bookingId,
      updateMyBookingDto,
      user.sub,
    );
  }

  @Get('my-booking/:bookingId')
  async findMyBooking(
    @Param('bookingId', new ParseUUIDPipe()) bookingId: string,
    @User() user: UserInterface,
  ) {
    return this.bookingService.findMyBooking(user.sub, bookingId);
  }

  @Post('cancel-my-booking/:bookingId')
  async cancelMyBooking(
    @User() user: UserInterface,
    @Param('bookingId', new ParseUUIDPipe()) bookingId: string,
  ) {
    return this.bookingService.cancelMyBooking(user.sub, bookingId);
  }

  // ==== STAFF ONLY ====
  @Roles(UserRole.Staff)
  @Get('all')
  async getAllBooking(@Query() getAllBookingDto: GetAllBookingDto) {
    return this.bookingService.getAllBooking(getAllBookingDto);
  }

  @Roles(UserRole.Staff)
  @Get('find-by-status')
  async findBookingByStatus(
    @Query() getBookingByStatusDto: GetBookingByStatusDto,
  ) {
    return this.bookingService.findBookingByStatus(getBookingByStatusDto);
  }

  @Roles(UserRole.Staff)
  @Get('today/booking')
  async findCheckinCheckoutToday(
    @Query() findCheckinCheckoutTodayDto: FindCheckinCheckoutTodayDto,
  ) {
    return this.bookingService.findCheckinCheckoutToday(
      findCheckinCheckoutTodayDto,
    );
  }

  @Roles(UserRole.Staff)
  @Get('today/summary')
  async getTodaySummary() {
    return this.bookingService.getTodayOccupancySummary();
  }

  @Get('top-rooms')
  async getTopRoomBookings(
    @Query('year') year?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedYear = year ? Number(year) : undefined;
    const parsedLimit = limit ? Number(limit) : 3;
    return this.bookingService.getTopRoomBookings(parsedYear, parsedLimit);
  }

  @Roles(UserRole.Staff)
  @Get('top-monthly-bookings')
  async getMonthlyBookings(@Query('year', ParseIntPipe) year: number) {
    return this.bookingService.getMonthlyBookings(year);
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
  @Post()
  async create(
    @Body() createBookingDto: CreateBookingDto,
    @User() user: UserInterface,
  ) {
    createBookingDto.userId = user.sub;
    return this.bookingService.create(createBookingDto);
  }

  @Roles(UserRole.Staff)
  @Post(':bookingId')
  async update(
    @Param('bookingId') bookingId: string,
    @Body() updateBookingDto: UpdateBookingDto,
  ) {
    return this.bookingService.update(bookingId, updateBookingDto);
  }

  @Roles(UserRole.Staff)
  @Post('reject-booking/:bookingId')
  async rejectBooking(
    @Param('bookingId', new ParseUUIDPipe()) bookingId: string,
  ) {
    return this.bookingService.rejectBooking(bookingId);
  }

  @Roles(UserRole.Staff)
  @Post('mark-as-paid/:bookingId')
  async markAsPaid(@Param('bookingId', new ParseUUIDPipe()) bookingId: string) {
    return this.bookingService.markAsPaid(bookingId);
  }

  @Roles(UserRole.Staff)
  @Post('check-in/:bookingId')
  async checkIn(@Param('bookingId', new ParseUUIDPipe()) bookingId: string) {
    return this.bookingService.checkIn(bookingId);
  }

  @Roles(UserRole.Staff)
  @Post('check-out/:bookingId')
  async checkOut(@Param('bookingId', new ParseUUIDPipe()) bookingId: string) {
    return this.bookingService.checkOut(bookingId);
  }

  @Roles(UserRole.Staff)
  @Get(':bookingId')
  async findOne(@Param('bookingId', new ParseUUIDPipe()) bookingId: string) {
    return this.bookingService.findOne(bookingId);
  }
}
