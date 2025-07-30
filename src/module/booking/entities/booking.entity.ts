import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TypeBooking } from '../enums/TypeBooking';
import { BookingStatus } from '../enums/bookingStatus';
import { User } from 'src/module/users/entities/user.entity';
import { Room } from 'src/module/room/entities/room.entity';
import { Review } from 'src/module/reviews/entities/review.entity';

@Entity()
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  bookingId: string;

  @Column({ type: 'datetime', nullable: false })
  startTime: Date;

  @Column({ type: 'datetime', nullable: false })
  endTime: Date;

  @Column({ type: 'datetime' })
  actualCheckIn?: Date;

  @Column({ type: 'datetime' })
  actualCheckOut?: Date;

  @Column({ type: 'enum', enum: TypeBooking })
  bookingType: TypeBooking;

  @Column({ type: 'enum', enum: BookingStatus, default: BookingStatus.Unpaid })
  bookingStatus: BookingStatus;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  bookingDate: Date;

  @Column({ type: 'int' })
  numberOfGuest: number;

  @ManyToOne(() => User, (user) => user.bookings, {
    nullable: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  user: User;

  @ManyToOne(() => Room, (room) => room.bookings, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  room: Room;

  @OneToOne(() => Review, (review) => review.booking, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  review: Review;

  @CreateDateColumn()
  createdDate: Date;

  @UpdateDateColumn()
  updateDate: Date;
}
