import {
  Controller,
  Get,
  Inject,
  Ip,
  Param,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import vnpayConfig from 'src/config/vnpay.config';
import { ConfigType } from '@nestjs/config';
import { Auth } from 'src/decorators/auth.decorator';
import { AuthType } from '../auth/enums/auth-type.enum';
import { Response } from 'express';

@Controller('payment')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    @Inject(vnpayConfig.KEY)
    private readonly vnpayConfiguration: ConfigType<typeof vnpayConfig>,
  ) {}

  @Post('online/:bookingId')
  async createOnlinePayment(
    @Param('bookingId') bookingId: string,
    @Ip() ipAddress: string,
  ) {
    const clientIp = ipAddress.includes(':') ? '127.0.0.1' : ipAddress;
    return this.paymentService.createOnlinePayment(bookingId, clientIp);
  }

  @Auth(AuthType.None)
  @Get('vnpay/ipn')
  async vnpayIpn(@Query() query: any, @Res() res: Response) {
    const result = await this.paymentService.handleVNPayCallback(query);

    if (result.success) {
      return res.json({ RspCode: '00', Message: 'Confirm Success' });
    } else {
      return res.json({ RspCode: '97', Message: 'Invalid signature' });
    }
  }

  @Auth(AuthType.None)
  @Get('vnpay/return')
  async handleVNPayReturn(@Query() query: any, @Res() res: Response) {
    console.log('VNPay return query:', query);
    // có thể redirect về frontend kèm trạng thái giao dịch
    return res.redirect(`${this.vnpayConfiguration.frontendUrl}`);
  }
}
