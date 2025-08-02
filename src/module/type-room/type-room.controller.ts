import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CreateTypeRoomDto } from './dtos/create-type-room.dto';
import { TypeRoomService } from './type-room.service';
import { Roles } from 'src/decorators/roles.decorator';
import { UserRole } from '../users/enum/user-role.enum';
import { GetTypeRoomDto } from './dtos/get-type-room.dto';
import { Auth } from 'src/decorators/auth.decorator';
import { AuthType } from '../auth/enums/auth-type.enum';
import { UpdateTypeRoomDto } from './dtos/update-type-room.dto';

@Controller('type-room')
export class TypeRoomController {
  constructor(private readonly typeRoomService: TypeRoomService) {}

  @Roles(UserRole.Staff)
  @Post('')
  async create(@Body() createTypeRoomDto: CreateTypeRoomDto) {
    return this.typeRoomService.create(createTypeRoomDto);
  }

  @Roles(UserRole.Staff)
  @Post(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTypeRoomDto: UpdateTypeRoomDto,
  ) {
    return this.typeRoomService.update(id, updateTypeRoomDto);
  }

  @Roles(UserRole.Staff)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.typeRoomService.remove(id);
  }

  @Auth(AuthType.None)
  @Get('')
  async findAll(@Query() getTypeRoomDto: GetTypeRoomDto) {
    return this.typeRoomService.findAll(getTypeRoomDto);
  }

  @Get(':id')
  @Auth(AuthType.None)
  findOne(@Param('id') id: string) {
    return this.typeRoomService.findOneById(id);
  }
}
