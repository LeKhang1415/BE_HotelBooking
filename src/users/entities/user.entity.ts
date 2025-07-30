import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Exclude } from 'class-transformer';
import { Review } from 'src/reviews/entities/review.entity';
import { Booking } from 'src/booking/entities/booking.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 96, nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 96, nullable: false, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 96 })
  @Exclude()
  password?: string;

  @Column({ type: 'varchar', length: 96 })
  @Exclude()
  confirmPassword?: string;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  @Exclude()
  googleId?: string;

  @OneToMany(() => Booking, (booking) => booking.user)
  bookings: Booking[];

  @OneToMany(() => Review, (review) => review.user)
  review: Review[];
}
