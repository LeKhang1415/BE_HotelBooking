import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService, ConfigType } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { CreatePaymentRequest } from '../interfaces/create-payment-request.interface';
import { CreatePaymentResponse } from '../interfaces/create-payment-response.interface';
import { VerifyPaymentResponse } from '../interfaces/verify-payment-response.interface';
import sepayConfig from 'src/config/sepay.config';

@Injectable()
export class SepayProvider {
  readonly providerName = 'sepay';
  private readonly logger = new Logger(SepayProvider.name);

  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly bankBin: string;
  private readonly accountNumber: string;
  private readonly accountName: string;

  constructor(
    private readonly httpService: HttpService,

    @Inject(sepayConfig.KEY)
    private readonly sepayConfiguration: ConfigType<typeof sepayConfig>,
  ) {
    this.apiUrl = sepayConfiguration.apiUrl as string;
    this.apiKey = sepayConfiguration.apiKey as string;
    this.bankBin = sepayConfiguration.bankBin as string;
    this.accountNumber = sepayConfiguration.accountNumber as string;
    this.accountName = sepayConfiguration.accountName as string;

    if (!this.apiKey || !this.accountNumber) {
      throw new Error('SePay configuration is incomplete');
    }
  }

  /**
   * Tạo QR Code thanh toán
   */
  async createPayment(
    request: CreatePaymentRequest,
  ): Promise<CreatePaymentResponse> {
    try {
      const { orderId, amount, description } = request;
      const paymentContent = this.generatePaymentContent(orderId, description);

      const qrCodeText = `${this.bankBin}|${this.accountNumber}|${this.accountName}|${paymentContent}|${amount}`;

      // Sinh QR image URL trực tiếp
      const qrImageUrl =
        `${'https://qr.sepay.vn/img'}?` +
        [
          `acc=${this.accountNumber}`,
          `bank=${this.bankBin}`,
          amount ? `amount=${amount}` : null,
          description ? `des=${encodeURIComponent(paymentContent)}` : null,
        ]
          .filter(Boolean)
          .join('&');

      return {
        qrCode: qrCodeText,
        qrDataURL: qrImageUrl, // link ảnh
        orderId,
      };
    } catch (error) {
      this.logger.error(
        `Failed to create SePay payment for order ${request.orderId}: ${error.message}`,
      );
      return {
        orderId: request.orderId,
      };
    }
  }

  /**
   * Verify payment status bằng cách check transactions từ SePay
   */
  async verifyPayment(
    orderId: string,
    expectedAmount: number,
  ): Promise<VerifyPaymentResponse> {
    try {
      const transactions = await this.getRecentTransactions(100);

      const matchingTransaction = transactions.find((tx: any) => {
        const content = tx.content || '';
        const hasOrderId = content
          .toLowerCase()
          .includes(`order${orderId.toLowerCase()}`);
        const amountMatch = tx.amountIn >= expectedAmount * 0.99;
        const isIncoming = tx.amountIn > 0;

        return hasOrderId && amountMatch && isIncoming;
      });

      if (matchingTransaction) {
        return {
          isPaid: true,
          transactionId: matchingTransaction.id,
          amount: matchingTransaction.amountIn,
          paidAt: new Date(matchingTransaction.transactionDate),
        };
      }

      return {
        isPaid: false,
      };
    } catch (error) {
      this.logger.error(
        `Failed to verify payment for order ${orderId}:`,
        error,
      );
      return {
        isPaid: false,
      };
    }
  }

  /**
   * Lấy danh sách transactions gần đây từ SePay API
   */
  async getRecentTransactions(limit = 50): Promise<any[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.apiUrl}/transactions`, {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
          params: {
            limit,
            offset: 0,
          },
          timeout: 10000,
        }),
      );

      return response.data.transactions || [];
    } catch (error) {
      this.logger.error('Failed to get recent transactions:', error);
      return [];
    }
  }

  /**
   * Helpers
   */
  private generatePaymentContent(
    orderId: string,
    description?: string,
  ): string {
    const baseContent = `ORDER${orderId}`;
    return description ? `${baseContent} ${description}` : baseContent;
  }
}
