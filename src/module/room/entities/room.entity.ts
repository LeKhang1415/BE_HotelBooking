import { Booking } from 'src/module/booking/entities/booking.entity';
import { TypeRoom } from 'src/module/type-room/entities/type-room.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RoomStatus } from '../enums/room-status.enum';
import { Exclude } from 'class-transformer';

@Entity()
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50, unique: true })
  name: string;

  @Column()
  pricePerDay: number;

  @Column()
  pricePerHour: number;

  @Column({ type: 'text' })
  interior: string;

  @Column({ type: 'text' })
  image: string;

  @Column({ type: 'text' })
  facilities: string;

  @Column({ type: 'enum', enum: RoomStatus, default: RoomStatus.ACTIVE })
  roomStatus: string;

  @ManyToOne(() => TypeRoom, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  typeRoom: TypeRoom;

  @OneToMany(() => Booking, (booking) => booking.room, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  bookings: Booking[];

  @CreateDateColumn()
  @Exclude()
  createdDate: Date;

  @UpdateDateColumn()
  @Exclude()
  updateDate: Date;

  @DeleteDateColumn()
  deleteDate: Date;
}
