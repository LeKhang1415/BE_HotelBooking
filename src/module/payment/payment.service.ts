import { Injectable } from '@nestjs/common';
import { Payment } from './entities/payment.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Booking } from '../booking/entities/booking.entity';
import { PaymentMethod } from './enums/payment-method.enum';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,

    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
  ) {}

  // Tạo payment cho online booking
  async createOnlinePayment(bookingId: string, paymentMethod: PaymentMethod) {}

  // Tạo payment cho walk-in
  async createWalkInPayment(bookingId: string, paymentMethod: PaymentMethod) {}

  // Tạo payment cho late checkout
  async createLateCheckoutPayment(bookingId: string, extraHours: number) {}

  // Calculate late checkout fee
  async calculateLateCheckoutFee(bookingId: string, actualCheckOut: Date) {}
}
