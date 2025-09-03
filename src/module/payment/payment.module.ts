import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { Booking } from '../booking/entities/booking.entity';
import { HttpModule } from '@nestjs/axios';
import { VNPayProvider } from './providers/vnpay.provider';

@Module({
  controllers: [PaymentController],
  providers: [PaymentService, VNPayProvider],
  imports: [TypeOrmModule.forFeature([Payment, Booking]), HttpModule],
})
export class PaymentModule {}
