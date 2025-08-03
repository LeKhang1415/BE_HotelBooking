import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CreateRoomDto } from './dtos/create-room.dto';
import { Auth } from 'src/decorators/auth.decorator';
import { AuthType } from '../auth/enums/auth-type.enum';
import { RoomService } from './room.service';
import { UpdateRoomDto } from './dtos/update-room.dto';
import { GetRoomDto } from './dtos/get-room.dto';

@Controller('room')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Auth(AuthType.None)
  @Post()
  async create(@Body() createRoomDto: CreateRoomDto) {
    return this.roomService.create(createRoomDto);
  }

  @Auth(AuthType.None)
  @Post('/:id')
  async update(@Param('id') id: string, @Body() updateRoomDto: UpdateRoomDto) {
    return this.roomService.update(id, updateRoomDto);
  }

  @Auth(AuthType.None)
  @Get()
  async findAll(@Query() getRoomDto: GetRoomDto) {
    return this.roomService.findAll(getRoomDto);
  }
}
