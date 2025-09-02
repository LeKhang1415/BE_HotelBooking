import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { Booking } from '../booking/entities/booking.entity';
import { SepayProvider } from './providers/sepay.provider';
import { HttpModule } from '@nestjs/axios';

@Module({
  controllers: [PaymentController],
  providers: [PaymentService, SepayProvider],
  imports: [TypeOrmModule.forFeature([Payment, Booking]), HttpModule],
})
export class PaymentModule {}
