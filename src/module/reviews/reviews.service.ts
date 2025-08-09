import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Review } from './entities/review.entity';
import { Repository } from 'typeorm';
import { Booking } from '../booking/entities/booking.entity';
import { Room } from '../room/entities/room.entity';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,

    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,

    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
  ) {}
}
