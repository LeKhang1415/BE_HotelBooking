import { PartialType } from '@nestjs/mapped-types';
import { RoomStatus } from '../enums/room-status.enum';
import { CreateRoomDto } from './create-room.dto';

export class UpdateRoomDto extends PartialType(CreateRoomDto) {
  status?: RoomStatus;
}
