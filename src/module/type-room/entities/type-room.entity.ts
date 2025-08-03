import { Exclude } from 'class-transformer';
import { Room } from 'src/module/room/entities/room.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class TypeRoom {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50, unique: true })
  name: string;

  @Column({ type: 'text' })
  introduction: string;

  @Column({ type: 'text' })
  highlight: string;

  @Column()
  sizeRoom: number;

  @Column()
  beds: string;

  @Column()
  maxPeople: number;

  @OneToMany(() => Room, (room) => room.typeRoom, {
    cascade: true,
  })
  rooms: Room[];

  @CreateDateColumn()
  @Exclude()
  createdDate: Date;

  @UpdateDateColumn()
  @Exclude()
  updateDate: Date;

  @DeleteDateColumn()
  @Exclude()
  deleteAt: Date;
}
