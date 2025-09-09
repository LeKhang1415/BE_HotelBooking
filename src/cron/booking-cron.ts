import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { BookingGateWay } from 'src/module/booking/booking.gateway';
import { BookingService } from 'src/module/booking/booking.service';

@Injectable()
export class BookingCron {
  private readonly logger = new Logger(BookingCron.name);
  constructor(
    private readonly bookingService: BookingService,
    private readonly bookingGateway: BookingGateWay,
  ) {}

  @Cron('*/1 * * * *')
  async handleBookingExpiration() {
    this.logger.log('Đang kiểm tra các booking quá hạn check-in...');
    try {
      const updatedBookings = await this.bookingService.autoNoShowCheck();

      updatedBookings.forEach((booking) => {
        this.bookingGateway.emitBookingNoShow(booking);
      });

      this.logger.log('Hoàn tất kiểm tra và cập nhật booking NoShow.');
    } catch (error) {
      this.logger.error('Lỗi trong quá trình kiểm tra booking NoShow:', error);
    }
  }

  @Cron('*/10 * * * *')
  async handleAutoCheckout() {
    this.logger.log('Đang kiểm tra các booking cần auto checkout...');
    try {
      const updatedBookings = await this.bookingService.autoCheckout();
      this.logger.log('Hoàn tất auto checkout cho các booking.');

      updatedBookings.forEach((booking) => {
        this.bookingGateway.emitBookingCheckedOut(booking);
      });
    } catch (error) {
      this.logger.error('Lỗi trong quá trình auto checkout:', error);
    }
  }
}
