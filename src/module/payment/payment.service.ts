import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Payment } from './entities/payment.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Booking } from '../booking/entities/booking.entity';
import { PaymentMethod } from './enums/payment-method.enum';
import { PaymentStatus } from './enums/payment-status.enum';
import { PaymentType } from './enums/payment-type.enum';
import { VNPayProvider } from './providers/vnpay.provider';
import { BookingStatus } from '../booking/enums/booking-status';
import vnpayConfig from 'src/config/vnpay.config';
import { ConfigType } from '@nestjs/config';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,

    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,

    private readonly vnpayProvider: VNPayProvider,

    @Inject(vnpayConfig.KEY)
    private readonly vnpayConfiguration: ConfigType<typeof vnpayConfig>,
  ) {}

  // Tạo payment cho online booking
  async createOnlinePayment(bookingId: string, ipAddr: string) {
    const booking = await this.bookingRepository.findOne({
      where: { bookingId },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    // Nếu booking đã thanh toán thì không cần tạo thêm payment nữa
    if (booking.bookingStatus === BookingStatus.Paid) {
      throw new BadRequestException('Booking đã được thanh toán');
    }

    const existingPending = booking.payments?.find(
      (p) => p.status === PaymentStatus.PENDING,
    );
    if (existingPending) {
      return {
        url: this.vnpayProvider.createPaymentUrl({
          amount: booking.totalAmount,
          orderInfo: `Thanh toan booking ${bookingId}`,
          txnRef: existingPending.paymentCode,
          ipAddr,
        }),
      };
    }

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

    return { url };
  }

  // Tạo payment cho walk-in
  async createWalkInPayment(bookingId: string, paymentMethod: PaymentMethod) {
    const booking = await this.bookingRepository.findOne({
      where: { bookingId },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    const paymentCode = crypto.randomUUID().slice(0, 12).replace(/-/g, '');

    const payment = this.paymentRepository.create({
      paymentCode,
      booking,
      amount: booking.totalAmount,
      paymentMethod,
      paymentType: PaymentType.BOOKING_PAYMENT,
      status: PaymentStatus.PENDING,
    });

    return await this.paymentRepository.save(payment);
  }

  // Xác nhận thanh toán walk-in (cash/card tại quầy)
  async confirmWalkInPayment(paymentCode: string) {
    const payment = await this.paymentRepository.findOne({
      where: { paymentCode },
      relations: ['booking'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    payment.status = PaymentStatus.SUCCESS;
    payment.paidAt = new Date();
    payment.amount = payment.booking.totalAmount;

    await this.paymentRepository.save(payment);

    // Cập nhật booking status
    const booking = payment.booking;
    booking.bookingStatus = BookingStatus.Paid;
    await this.bookingRepository.save(booking);

    return payment;
  }

  // Calculate late checkout fee
  async calculateLateCheckoutFee(bookingId: string, actualCheckOut: Date) {}

  async handleVNPayReturn(query: any): Promise<string> {
    console.log('VNPay return query:', query);

    const isValid = this.vnpayProvider.verifyCallback(query);
    if (!isValid) {
      return `${this.vnpayConfiguration.frontendUrl}/payment-fail?orderId=${query.vnp_TxnRef}`;
    }

    const payment = await this.paymentRepository.findOne({
      where: { paymentCode: query.vnp_TxnRef },
      relations: ['booking'],
    });

    if (!payment) {
      return `${this.vnpayConfiguration.frontendUrl}/payment-fail?orderId=${query.vnp_TxnRef}`;
    }

    if (query.vnp_ResponseCode === '00') {
      // Thành công
      payment.status = PaymentStatus.SUCCESS;
      payment.paidAt = new Date();

      payment.booking.bookingStatus = BookingStatus.Paid;
      await this.bookingRepository.save(payment.booking);
      await this.paymentRepository.save(payment);

      return `${this.vnpayConfiguration.frontendUrl}/payment-success?orderId=${query.vnp_TxnRef}`;
    } else {
      // Thất bại
      payment.status = PaymentStatus.FAILED;
      await this.paymentRepository.save(payment);

      return `${this.vnpayConfiguration.frontendUrl}/payment-fail?orderId=${query.vnp_TxnRef}`;
    }
  }
}
