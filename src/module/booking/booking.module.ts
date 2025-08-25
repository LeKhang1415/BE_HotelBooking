import { Module } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { Room } from '../room/entities/room.entity';
import { Booking } from './entities/booking.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaginationModule } from 'src/common/pagination/pagination.module';
import { RoomModule } from '../room/room.module';
import { User } from '../users/entities/user.entity';
import { Customer } from '../customer/entities/customer.entity';
import { CustomerModule } from '../customer/customer.module';

@Module({
  providers: [BookingService],
  controllers: [BookingController],
  imports: [
    TypeOrmModule.forFeature([Room, Booking, User, Customer]),
    PaginationModule,
    CustomerModule,
    RoomModule,
  ],
  exports: [BookingService],
})
export class BookingModule {}
