import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TypeBooking } from '../enums/typeBooking';
import { BookingStatus } from '../enums/bookingStatus';
import { User } from 'src/module/users/entities/user.entity';
import { Room } from 'src/module/room/entities/room.entity';
import { Review } from 'src/module/reviews/entities/review.entity';
import { Exclude } from 'class-transformer';
import { Payment } from 'src/module/payment/entities/payment.entity';

@Entity()
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  bookingId: string;

  @Column({ type: 'timestamp', nullable: false })
  startTime: Date;

  @Column({ type: 'timestamp', nullable: false })
  endTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  actualCheckIn?: Date;

  @Column({ type: 'timestamp', nullable: true })
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
  user?: User;

  @ManyToOne(() => Room, (room) => room.bookings, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  room: Room;

  @OneToMany(() => Payment, (payment) => payment.booking, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  payments: Payment[];

  @OneToOne(() => Review, (review) => review.booking, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  review: Review;

  @CreateDateColumn()
  @Exclude()
  createdDate: Date;

  @UpdateDateColumn()
  @Exclude()
  updateDate: Date;
}
