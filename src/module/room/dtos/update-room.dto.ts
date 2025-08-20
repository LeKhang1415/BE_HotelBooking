import { IsEnum, IsOptional } from 'class-validator';
import { RoomStatus } from '../enums/room-status.enum';
import { CreateRoomDto } from './create-room.dto';
import { PartialType } from '@nestjs/mapped-types';

export class UpdateRoomDto extends PartialType(CreateRoomDto) {
  @IsOptional()
  @IsEnum(RoomStatus, { message: 'Trạng thái không hợp lệ' })
  status?: RoomStatus;
}
