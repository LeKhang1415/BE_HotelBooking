import { User } from 'src/module/users/entities/user.entity';
import {
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Entity,
  Unique,
  ManyToOne,
} from 'typeorm';

@Entity()
@Unique(['user', 'admin'])
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: true })
  user: User;

  @ManyToOne(() => User, { eager: true })
  admin: User;

  @Column({ type: 'text', nullable: true })
  lastMessageText?: string;

  @Column({ type: 'varchar', nullable: true })
  lastMessageFromEmail?: string;

  @Column({ type: 'timestamp', nullable: true })
  lastMessageAt?: Date;

  @Column({ type: 'int', default: 0 })
  unreadForAdmin: number;

  @Column({ type: 'int', default: 0 })
  unreadForUser: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
