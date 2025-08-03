import { Module } from '@nestjs/common';
import { TypeRoomController } from './type-room.controller';
import { TypeRoomService } from './type-room.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeRoom } from './entities/type-room.entity';
import { PaginationModule } from 'src/common/pagination/pagination.module';

@Module({
  controllers: [TypeRoomController],
  providers: [TypeRoomService],
  imports: [TypeOrmModule.forFeature([TypeRoom]), PaginationModule],
  exports: [TypeRoomService],
})
export class TypeRoomModule {}
