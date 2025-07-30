import { Room } from 'src/room/entities/room.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class TypeRoom {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50 })
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
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  rooms: Room[];
}
