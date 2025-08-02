import { Booking } from 'src/module/booking/entities/booking.entity';
import { TypeRoom } from 'src/module/type-room/entities/type-room.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

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

  @ManyToOne(() => TypeRoom, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  typeRoom: TypeRoom;

  @OneToMany(() => Booking, (booking) => booking.room, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  bookings: Booking[];

  @CreateDateColumn()
  createdDate: Date;

  @UpdateDateColumn()
  updateDate: Date;
}
