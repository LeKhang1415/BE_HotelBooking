import { Module } from '@nestjs/common';
import { TypeRoomController } from './type-room.controller';
import { TypeRoomService } from './type-room.service';

@Module({
  controllers: [TypeRoomController],
  providers: [TypeRoomService]
})
export class TypeRoomModule {}
