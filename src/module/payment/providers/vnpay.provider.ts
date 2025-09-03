import { Injectable, Inject } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import vnpayConfig from 'src/config/vnpay.config';
import * as crypto from 'crypto';

@Injectable()
export class VNPayProvider {
  constructor(
    @Inject(vnpayConfig.KEY)
    private config: ConfigType<typeof vnpayConfig>,
  ) {}

  createPaymentUrl(params: {
    amount: number;
    orderInfo: string;
    txnRef: string;
    ipAddr: string;
  }) {
    const date = this.formatDate(new Date());
    const expireDate = this.formatDate(new Date(Date.now() + 15 * 60 * 1000));

    let vnpParams: Record<string, string> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: this.config.tmnCode as string,
      vnp_Amount: (params.amount * 100).toString(),
      vnp_CurrCode: 'VND',
      vnp_TxnRef: params.txnRef,
      vnp_OrderInfo: params.orderInfo,
      vnp_OrderType: 'other',
      vnp_Locale: 'vn',
      vnp_ReturnUrl: this.config.returnUrl,
      vnp_IpAddr: params.ipAddr,
      vnp_CreateDate: date,
      vnp_ExpireDate: expireDate,
    };

    vnpParams = this.sortObject(vnpParams);

    const signData = this.buildSignData(vnpParams);
    const secureHash = this.createSecureHash(signData);

    vnpParams.vnp_SecureHash = secureHash;
    vnpParams.vnp_SecureHashType = 'HmacSHA512';

    return `${this.config.url}?${this.buildUrlParams(vnpParams)}`;
  }

  verifyCallback(query: Record<string, any>): boolean {
    const vnpSecureHash = query.vnp_SecureHash;

    delete query.vnp_SecureHash;
    delete query.vnp_SecureHashType;

    const sortedParams = this.sortObject(query);
    const signData = this.buildSignData(sortedParams);
    const checkSum = this.createSecureHash(signData);

    return vnpSecureHash === checkSum;
  }

  private sortObject(obj: Record<string, any>): Record<string, string> {
    const sorted: Record<string, string> = {};
    const keys = Object.keys(obj).sort();

    keys.forEach((key) => {
      const value = obj[key];
      if (value !== null && value !== undefined && value !== '') {
        sorted[key] = value.toString();
      }
    });

    return sorted;
  }

  private encodeValue(value: string): string {
    return encodeURIComponent(value).replace(/%20/g, '+');
  }

  private buildSignData(params: Record<string, string>): string {
    return Object.keys(params)
      .map((key) => `${key}=${this.encodeValue(params[key])}`)
      .join('&');
  }

  private buildUrlParams(params: Record<string, string>): string {
    return Object.keys(params)
      .map(
        (key) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`,
      )
      .join('&');
  }

  private createSecureHash(data: string): string {
    return crypto
      .createHmac('sha512', this.config.hashSecret as string)
      .update(data, 'utf8')
      .digest('hex');
  }

  private formatDate(date: Date): string {
    const yyyy = date.getFullYear().toString();
    const MM = (date.getMonth() + 1).toString().padStart(2, '0');
    const dd = date.getDate().toString().padStart(2, '0');
    const HH = date.getHours().toString().padStart(2, '0');
    const mm = date.getMinutes().toString().padStart(2, '0');
    const ss = date.getSeconds().toString().padStart(2, '0');
    return `${yyyy}${MM}${dd}${HH}${mm}${ss}`;
  }
}
