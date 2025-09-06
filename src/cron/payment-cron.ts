import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PaymentService } from 'src/module/payment/payment.service';

@Injectable()
export class PaymentCron {
  private readonly logger = new Logger(PaymentCron.name);
  constructor(private readonly paymentService: PaymentService) {}

  @Cron('*/30 * * * *')
  async handlePaymentExpiration() {
    this.logger.log('Đang kiểm tra các thanh toán đang chờ xử lý...');
    try {
      await this.paymentService.autoExpirePendingPayments();
      this.logger.log('Hoàn tất kiểm tra và cập nhật thanh toán chờ xử lý.');
    } catch (error) {
      this.logger.error(
        'Lỗi trong quá trình kiểm tra thanh toán chờ xử lý:',
        error,
      );
    }
  }
}
