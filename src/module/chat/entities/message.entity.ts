// src/chat/entities/message.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Conversation } from './conversation.entity';
import { MessageStatus } from '../enums/message-status.enum';

@Entity()
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  conversationId: string;

  @ManyToOne(() => Conversation, (conversation) => conversation.id, {
    onDelete: 'CASCADE',
  })
  conversation: Conversation;

  @Column({ type: 'varchar', nullable: false })
  fromEmail: string;

  @Column({ type: 'varchar', nullable: false })
  toEmail: string;

  @Column({ type: 'text', nullable: true })
  text?: string;

  @Column({ type: 'jsonb', nullable: true, default: () => "'[]'" })
  attachments?: Array<{ url: string; type?: string; size?: number }>;

  @Column({
    type: 'enum',
    enum: MessageStatus,
    default: MessageStatus.SENT,
  })
  status: MessageStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
