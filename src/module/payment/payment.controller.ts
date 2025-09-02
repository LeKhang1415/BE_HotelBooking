import { Body, Controller, Param, Post } from '@nestjs/common';
import { PaymentMethod } from './enums/payment-method.enum';
import { PaymentService } from './payment.service';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}
  // Tạo payment cho online booking
  @Post('online/:bookingId')
  async createOnlinePayment(@Param('bookingId') bookingId: string) {
    return this.paymentService.createOnlinePayment(bookingId);
  }
}
