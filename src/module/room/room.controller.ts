import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
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
import { UserRole } from '../users/enum/user-role.enum';
import { Roles } from 'src/decorators/roles.decorator';
import { CheckRoomAvailableDto } from './dtos/check-room-available.dto';

@Controller('room')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Roles(UserRole.Staff)
  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @Body() createRoomDto: CreateRoomDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.roomService.create(createRoomDto, file);
  }

  @Roles(UserRole.Staff)
  @Post(':id')
  @UseInterceptors(FileInterceptor('image'))
  async update(
    @Param('id') id: string,
    @Body() updateRoomDto: UpdateRoomDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.roomService.update(id, updateRoomDto, file);
  }

  @Get('available')
  async findAvailableRoomsInTime(
    @Query() findAvailableRoomDto: FindAvailableRoomDto,
  ) {
    return this.roomService.findAvailableRoomsInTime(findAvailableRoomDto);
  }

  @Get('is-available/:id')
  async isAvailable(
    @Param('id', new ParseUUIDPipe()) roomId: string,
    @Query() checkRoomAvailableDto: CheckRoomAvailableDto,
  ) {
    return this.roomService.checkAvailability(roomId, checkRoomAvailableDto);
  }

  @Auth(AuthType.None)
  @Get(``)
  async findAll(@Query() getRoomDto: GetRoomDto) {
    return this.roomService.findAll(getRoomDto);
  }

  @Get(`all`)
  async findAllWithoutPagination() {
    return this.roomService.findAllRoomsWithoutPagination();
  }

  @Auth(AuthType.None)
  @Get(`/:roomId`)
  async findOne(@Param('roomId', new ParseUUIDPipe()) roomId: string) {
    return this.roomService.findOne(roomId);
  }

  @Roles(UserRole.Staff)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.roomService.remove(id);
  }
}
