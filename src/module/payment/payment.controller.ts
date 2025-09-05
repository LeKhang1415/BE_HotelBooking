import { Controller, Get, Ip, Param, Post, Query, Res } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { Auth } from 'src/decorators/auth.decorator';
import { AuthType } from '../auth/enums/auth-type.enum';
import { Response } from 'express';
import { Roles } from 'src/decorators/roles.decorator';
import { UserRole } from '../users/enum/user-role.enum';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('online/:bookingId')
  async createOnlinePayment(
    @Param('bookingId') bookingId: string,
    @Ip() ipAddress: string,
  ) {
    const clientIp = ipAddress.includes(':') ? '127.0.0.1' : ipAddress;
    return this.paymentService.createOnlineBookingPayment(bookingId, clientIp);
  }

  // Tạo payment cash (walk-in)
  @Roles(UserRole.Staff)
  @Post('walkin/:bookingId')
  async createWalkInPayment(@Param('bookingId') bookingId: string) {
    return this.paymentService.createWalkInBookingPayment(bookingId);
  }

  // Xác nhận payment cash
  @Roles(UserRole.Staff)
  @Post('walkin/confirm/:paymentCode')
  async confirmWalkInPayment(@Param('paymentCode') paymentCode: string) {
    return this.paymentService.confirmWalkInBookingPayment(paymentCode);
  }

  @Auth(AuthType.None)
  @Get('vnpay/return')
  async handleVNPayReturn(@Query() query: any, @Res() res: Response) {
    const redirectUrl = await this.paymentService.handleVNPayReturn(query);
    return res.redirect(redirectUrl);
  }
}
