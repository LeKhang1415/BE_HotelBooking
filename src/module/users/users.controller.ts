import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Auth } from 'src/decorators/auth.decorator';
import { AuthType } from '../auth/enums/auth-type.enum';
import { Roles } from 'src/decorators/roles.decorator';
import { UserRole } from './enum/user-role.enum';
import { GetUserDto } from './dto/get-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles(UserRole.Staff)
  @Post()
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Roles(UserRole.Staff)
  @Post('id')
  async updateUser(
    @Param('id') userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(userId, updateUserDto);
  }

  @Roles(UserRole.Staff)
  @Get()
  async getAllUser(@Query() getUserDto: GetUserDto) {
    return this.usersService.getAllUser(getUserDto);
  }
  @Roles(UserRole.Staff)
  @Get('id')
  async getUserById(@Param('id') userId: string) {
    return this.usersService.findByID(userId);
  }
}
