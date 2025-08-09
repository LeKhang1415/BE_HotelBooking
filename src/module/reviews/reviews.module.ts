import { Module } from '@nestjs/common';
import { ReviewController } from './reviews.controller';
import { ReviewService } from './reviews.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from './entities/review.entity';
import { Booking } from '../booking/entities/booking.entity';
import { Room } from '../room/entities/room.entity';

@Module({
  controllers: [ReviewController],
  providers: [ReviewService],
  imports: [TypeOrmModule.forFeature([Review, Booking, Room])],
})
export class ReviewModule {}
