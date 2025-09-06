import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Payment } from './entities/payment.entity';
import {
  FindOptionsOrder,
  FindOptionsWhere,
  LessThanOrEqual,
  Repository,
} from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Booking } from '../booking/entities/booking.entity';
import { PaymentMethod } from './enums/payment-method.enum';
import { PaymentStatus } from './enums/payment-status.enum';
import { PaymentType } from './enums/payment-type.enum';
import { VNPayProvider } from './providers/vnpay.provider';
import { BookingStatus } from '../booking/enums/booking-status';
import vnpayConfig from 'src/config/vnpay.config';
import { ConfigType } from '@nestjs/config';
import { PaginationProvider } from 'src/common/pagination/providers/pagination.provider';
import { GetAllPaymentDto } from './dtos/get-payment.dto';
import { Paginated } from 'src/common/pagination/interfaces/paginated.interface';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,

    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,

    private readonly vnpayProvider: VNPayProvider,

    private readonly paginationProvider: PaginationProvider,

    @Inject(vnpayConfig.KEY)
    private readonly vnpayConfiguration: ConfigType<typeof vnpayConfig>,
  ) {}

  // Tạo payment cho online booking
  async createOnlineBookingPayment(bookingId: string, ipAddr: string) {
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
  async createWalkInBookingPayment(bookingId: string) {
    const booking = await this.bookingRepository.findOne({
      where: { bookingId },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    // Nếu booking đã thanh toán thì không cần tạo thêm payment nữa
    if (booking.bookingStatus === BookingStatus.Paid) {
      throw new BadRequestException('Booking đã được thanh toán');
    }

    const paymentCode = crypto.randomUUID().slice(0, 12).replace(/-/g, '');

    const payment = this.paymentRepository.create({
      paymentCode,
      booking,
      amount: booking.totalAmount,
      paymentMethod: PaymentMethod.Cash,
      paymentType: PaymentType.BOOKING_PAYMENT,
      status: PaymentStatus.PENDING,
    });

    return await this.paymentRepository.save(payment);
  }

  // Xác nhận thanh toán walk-in (cash/card tại quầy)
  async confirmWalkInBookingPayment(paymentCode: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { paymentCode },
      relations: ['booking'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException('Payment already confirmed or invalid');
    }

    // cập nhật trạng thái thanh toán
    payment.status = PaymentStatus.SUCCESS;
    payment.paidAt = new Date();

    await this.paymentRepository.save(payment);

    // cập nhật trạng thái booking
    if (payment.booking) {
      payment.booking.bookingStatus = BookingStatus.Paid;
      await this.bookingRepository.save(payment.booking);
    }

    return payment;
  }

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

  async getAllPayment(
    getAllPaymentDto: GetAllPaymentDto,
  ): Promise<Paginated<Payment>> {
    const { status, method, type, bookingId, ...pagination } = getAllPaymentDto;

    const where: FindOptionsWhere<Payment> = {};

    // Filter by status
    if (status) {
      where.status = status as PaymentStatus;
    }

    // Filter by payment method
    if (method) {
      where.paymentMethod = method as PaymentMethod;
    }

    // Filter by payment type
    if (type) {
      where.paymentType = type as PaymentType;
    }

    // Filter by booking
    if (bookingId) {
      where.booking = { bookingId };
    }

    const relations = ['booking', 'booking.user', 'booking.room'];
    const order: FindOptionsOrder<Payment> = {
      createdAt: 'DESC',
      paidAt: 'DESC',
    };

    return await this.paginationProvider.paginateQuery(
      pagination,
      this.paymentRepository,
      where,
      order,
      relations,
    );
  }

  async autoExpirePendingPayments(): Promise<void> {
    const now = new Date();
    const fifteenMinutes = new Date(now.getTime() - 15 * 60 * 1000);

    const pendingPayments = await this.paymentRepository.find({
      where: {
        status: PaymentStatus.PENDING,
        createdAt: LessThanOrEqual(fifteenMinutes),
      },
      relations: ['booking'],
    });

    if (!pendingPayments.length) return;

    for (const payment of pendingPayments) {
      payment.status = PaymentStatus.FAILED;
      await this.paymentRepository.save(payment);

      this.logger.warn(
        `Payment ${payment.paymentId} => FAILED (pending quá 15 phút không xử lý)`,
      );
    }
  }
}
