import { Module } from '@nestjs/common';
import { RoomController } from './room.controller';
import { RoomService } from './room.service';
import { TypeRoomModule } from '../type-room/type-room.module';
import { PaginationModule } from 'src/common/pagination/pagination.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Room } from './entities/room.entity';
import { TypeRoom } from '../type-room/entities/type-room.entity';

@Module({
  controllers: [RoomController],
  providers: [RoomService],
  imports: [
    TypeOrmModule.forFeature([Room, TypeRoom]),
    TypeRoomModule,
    PaginationModule,
  ],
})
export class RoomModule {}
