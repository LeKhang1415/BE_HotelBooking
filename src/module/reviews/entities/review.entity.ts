import { Min } from 'class-validator';
import { Booking } from 'src/module/booking/entities/booking.entity';
import { Room } from 'src/module/room/entities/room.entity';
import { User } from 'src/module/users/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int' })
  rating: number; // 1-5 sao

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column({ type: 'json', nullable: true })
  images: string[]; // Array URLs của ảnh review

  @ManyToOne(() => User, (user) => user.reviews, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Room, (room) => room.reviews, { eager: true })
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @ManyToOne(() => Booking, (booking) => booking.review, { eager: true })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking; // Liên kết với booking để verify

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
