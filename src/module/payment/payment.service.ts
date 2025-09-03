import { Injectable, NotFoundException } from '@nestjs/common';
import { Payment } from './entities/payment.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Booking } from '../booking/entities/booking.entity';
import { PaymentMethod } from './enums/payment-method.enum';
import { PaymentStatus } from './enums/payment-status.enum';
import { PaymentType } from './enums/payment-type.enum';
import { VNPayProvider } from './providers/vnpay.provider';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,

    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,

    private readonly vnpayProvider: VNPayProvider,
  ) {}

  // Tạo payment cho online booking
  async createOnlinePayment(bookingId: string, ipAddr: string) {
    const booking = await this.bookingRepository.findOne({
      where: { bookingId },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    // Tạo transaction reference unique
    const txnRef = crypto.randomUUID().slice(0, 12).replace(/-/g, '');

    const payment = this.paymentRepository.create({
      paymentCode: txnRef,
      booking,
      amount: booking.totalAmount,
      paymentMethod: PaymentMethod.VnPay,
      paymentType: PaymentType.BOOKING_PAYMENT,
      status: PaymentStatus.PENDING,
    });
    await this.paymentRepository.save(payment);

    const url = this.vnpayProvider.createPaymentUrl({
      amount: booking.totalAmount,
      orderInfo: `Thanh toan booking ${bookingId}`,
      txnRef,
      ipAddr,
    });

    return { url, txnRef };
  }

  // Tạo payment cho walk-in
  async createWalkInPayment(bookingId: string, paymentMethod: PaymentMethod) {}

  // Tạo payment cho late checkout
  async createLateCheckoutPayment(bookingId: string, extraHours: number) {}

  // Calculate late checkout fee
  async calculateLateCheckoutFee(bookingId: string, actualCheckOut: Date) {}

  async handleVNPayCallback(query: any) {
    console.log('VNPay callback received:', query);

    const isValid = this.vnpayProvider.verifyCallback(query);
    console.log('Callback verification:', isValid);

    if (!isValid) {
      throw new Error('Invalid VNPay signature');
    }

    const payment = await this.paymentRepository.findOne({
      where: { paymentCode: query.vnp_TxnRef },
      relations: ['booking'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    console.log('Payment found:', payment);

    // Cập nhật status dựa trên response code
    if (query.vnp_ResponseCode === '00') {
      payment.status = PaymentStatus.SUCCESS;
      payment.paidAt = new Date();
      console.log('Payment successful');
    } else {
      payment.status = PaymentStatus.FAILED;
      console.log('Payment failed, response code:', query.vnp_ResponseCode);
    }

    await this.paymentRepository.save(payment);

    return {
      success: query.vnp_ResponseCode === '00',
      payment,
      responseCode: query.vnp_ResponseCode,
    };
  }
}
