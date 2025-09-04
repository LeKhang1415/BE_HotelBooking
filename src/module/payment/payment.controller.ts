import { Controller, Get, Ip, Param, Post, Query, Res } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { Auth } from 'src/decorators/auth.decorator';
import { AuthType } from '../auth/enums/auth-type.enum';
import { Response } from 'express';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('online/:bookingId')
  async createOnlinePayment(
    @Param('bookingId') bookingId: string,
    @Ip() ipAddress: string,
  ) {
    const clientIp = ipAddress.includes(':') ? '127.0.0.1' : ipAddress;
    return this.paymentService.createOnlinePayment(bookingId, clientIp);
  }

  @Auth(AuthType.None)
  @Get('vnpay/return')
  async handleVNPayReturn(@Query() query: any, @Res() res: Response) {
    const redirectUrl = await this.paymentService.handleVNPayReturn(query);
    return res.redirect(redirectUrl);
  }
}
