import { PartialType } from '@nestjs/mapped-types';
import { CreateTypeRoomDto } from './create-type-room.dto';

export class UpdateTypeRoomDto extends PartialType(CreateTypeRoomDto) {}
