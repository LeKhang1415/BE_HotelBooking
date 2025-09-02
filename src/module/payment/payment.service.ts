import { Injectable } from '@nestjs/common';
import { Payment } from './entities/payment.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Booking } from '../booking/entities/booking.entity';
import { PaymentMethod } from './enums/payment-method.enum';
import { SepayProvider } from './providers/sepay.provider';
import { PaymentStatus } from './enums/payment-status.enum';
import { PaymentType } from './enums/payment-type.enum';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,

    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,

    private readonly sepayProvider: SepayProvider,
  ) {}

  // Tạo payment cho online booking
  async createOnlinePayment(bookingId: string) {
    const booking = await this.bookingRepository.findOne({
      where: { bookingId },
    });

    if (!booking) {
      throw new Error(`Booking with id ${bookingId} not found`);
    }

    // Tạo payment record trong DB
    const payment = this.paymentRepository.create({
      booking,
      amount: booking.totalAmount,
      paymentMethod: PaymentMethod.SePay,
      status: PaymentStatus.PENDING,
      paymentType: PaymentType.BOOKING_PAYMENT,
      paymentCode: `PAY3`,
    });
    await this.paymentRepository.save(payment);

    // Gọi SePay API tạo QR code
    const sepayResult = await this.sepayProvider.createPayment({
      orderId: payment.paymentId,
      amount: booking.totalAmount,
      description: `Booking ${booking.bookingId}`,
    });

    return {
      paymentId: payment.paymentId,
      qrCode: sepayResult.qrCode,
      qrDataURL: sepayResult.qrDataURL,
    };
  }

  // Tạo payment cho walk-in
  async createWalkInPayment(bookingId: string, paymentMethod: PaymentMethod) {}

  // Tạo payment cho late checkout
  async createLateCheckoutPayment(bookingId: string, extraHours: number) {}

  // Calculate late checkout fee
  async calculateLateCheckoutFee(bookingId: string, actualCheckOut: Date) {}
}
