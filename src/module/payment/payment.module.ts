import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { Booking } from '../booking/entities/booking.entity';
import { HttpModule } from '@nestjs/axios';
import { VNPayProvider } from './providers/vnpay.provider';
import { PaginationModule } from 'src/common/pagination/pagination.module';
import { PaymentCron } from 'src/cron/payment-cron';

@Module({
  controllers: [PaymentController],
  providers: [PaymentService, VNPayProvider, PaymentCron],
  imports: [
    TypeOrmModule.forFeature([Payment, Booking]),
    HttpModule,
    PaginationModule,
  ],
})
export class PaymentModule {}
