import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CreateRoomDto } from './dtos/create-room.dto';
import { Auth } from 'src/decorators/auth.decorator';
import { AuthType } from '../auth/enums/auth-type.enum';
import { RoomService } from './room.service';
import { UpdateRoomDto } from './dtos/update-room.dto';
import { GetRoomDto } from './dtos/get-room.dto';
import { FindAvailableRoomDto } from './dtos/find-available-room.dto';

@Controller('room')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Post()
  async create(@Body() createRoomDto: CreateRoomDto) {
    return this.roomService.create(createRoomDto);
  }

  @Post(':id')
  async update(@Param('id') id: string, @Body() updateRoomDto: UpdateRoomDto) {
    return this.roomService.update(id, updateRoomDto);
  }

  @Auth(AuthType.None)
  @Get(`{/:typeRoomId}`)
  async findAll(
    @Param('typeRoomId') typeRoomId: string,
    @Query() getRoomDto: GetRoomDto,
  ) {
    return this.roomService.findAll(typeRoomId, getRoomDto);
  }

  @Get(`/:roomId`)
  async findOne(@Param('roomId') roomId: string) {
    return this.roomService.findOne(roomId);
  }

  @Get('available{/:typeRoomId}')
  async findAvailableRoomsInTime(
    @Param('typeRoomId') typeRoomId: string,
    @Query() findAvailableRoomDto: FindAvailableRoomDto,
  ) {
    return this.roomService.findAvailableRoomsInTime(
      typeRoomId,
      findAvailableRoomDto,
    );
  }
}
