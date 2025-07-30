import { Booking } from 'src/module/booking/entities/booking.entity';
import { TypeRoom } from 'src/module/type-room/entities/type-room.entity';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: number;

  @Column()
  pricePerDay: number;

  @Column({ length: 50, unique: true })
  name: string;

  @Column()
  pricePerHour: number;

  @Column({ type: 'text' })
  interior: string;

  @Column({ type: 'text' })
  image: string;

  @Column({ type: 'text' })
  facilities: string;

  @ManyToOne(() => TypeRoom, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  typeRoom: TypeRoom;

  @OneToMany(() => Booking, (booking) => booking.room, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  bookings: Booking[];
}
