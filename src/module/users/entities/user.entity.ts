import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Exclude } from 'class-transformer';
import { Review } from 'src/module/reviews/entities/review.entity';
import { Booking } from 'src/module/booking/entities/booking.entity';
import { UserRole } from '../enum/user-role.enum';

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

  @Column({ type: 'enum', enum: UserRole, default: UserRole.Customer })
  role: UserRole;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  @Exclude()
  googleId?: string;

  @OneToMany(() => Booking, (booking) => booking.user)
  bookings?: Booking[];

  @OneToMany(() => Review, (review) => review.user)
  reviews?: Review[];
}
