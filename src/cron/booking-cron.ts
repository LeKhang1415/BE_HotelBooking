import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { BookingService } from 'src/module/booking/booking.service';

@Injectable()
export class BookingCron {
  private readonly logger = new Logger(BookingCron.name);
  constructor(private readonly bookingService: BookingService) {}

  @Cron('*/5 * * * *')
  async handleBookingExpiration() {
    this.logger.log('Đang kiểm tra các booking quá hạn check-in...');
    try {
      await this.bookingService.autoNoShowCheck();
      this.logger.log('Hoàn tất kiểm tra và cập nhật booking NoShow.');
    } catch (error) {
      this.logger.error('Lỗi trong quá trình kiểm tra booking NoShow:', error);
    }
  }

  @Cron('*/10 * * * *')
  async handleAutoCheckout() {
    this.logger.log('Đang kiểm tra các booking cần auto checkout...');
    try {
      await this.bookingService.autoCheckout();
      this.logger.log('Hoàn tất auto checkout cho các booking.');
    } catch (error) {
      this.logger.error('Lỗi trong quá trình auto checkout:', error);
    }
  }
}
