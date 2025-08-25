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
import { StayType } from '../enums/stay-type';
import { BookingStatus } from '../enums/booking-status';
import { User } from 'src/module/users/entities/user.entity';
import { Room } from 'src/module/room/entities/room.entity';
import { Review } from 'src/module/reviews/entities/review.entity';
import { Exclude } from 'class-transformer';
import { Payment } from 'src/module/payment/entities/payment.entity';
import { BookingType } from '../enums/booking-type';
import { Customer } from 'src/module/customer/entities/customer.entity';

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

  @Column({ type: 'enum', enum: StayType, nullable: true })
  stayType: StayType;

  @Column({ type: 'enum', enum: BookingType, default: BookingType.ONLINE })
  bookingType: BookingType;

  @Column({ type: 'enum', enum: BookingStatus, default: BookingStatus.Unpaid })
  bookingStatus: BookingStatus;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  bookingDate: Date;

  @Column({ type: 'int' })
  numberOfGuest: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  createdBy?: string;

  @ManyToOne(() => User, (user) => user.bookings, {
    nullable: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  user?: User;

  @ManyToOne(() => Customer, (customer) => customer.bookings, {
    nullable: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  customer?: Customer;

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

  @OneToMany(() => Payment, (payment) => payment.booking, { cascade: true })
  payments: Payment[];

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    default: 0,
  })
  totalAmount: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    nullable: true,
  })
  extraCharges: number;
  @CreateDateColumn()
  @Exclude()
  createdDate: Date;

  @UpdateDateColumn()
  @Exclude()
  updateDate: Date;
}
