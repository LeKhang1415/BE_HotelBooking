import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { CreateRoomDto } from './dtos/create-room.dto';
import { Auth } from 'src/decorators/auth.decorator';
import { AuthType } from '../auth/enums/auth-type.enum';
import { RoomService } from './room.service';
import { UpdateRoomDto } from './dtos/update-room.dto';
import { GetRoomDto } from './dtos/get-room.dto';
import { FindAvailableRoomDto } from './dtos/find-available-room.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('room')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @Body() createRoomDto: CreateRoomDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.roomService.create(createRoomDto, file);
  }

  @Post(':id')
  @UseInterceptors(FileInterceptor('image'))
  async update(
    @Param('id') id: string,
    @Body() updateRoomDto: UpdateRoomDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.roomService.update(id, updateRoomDto, file);
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
