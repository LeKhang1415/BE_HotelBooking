import {
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Entity,
} from 'typeorm';

@Entity()
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: false })
  @Index()
  userEmail: string;

  @Column({ type: 'varchar', nullable: false })
  @Index()
  adminEmail: string;

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
