import { Body, Controller, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Auth } from 'src/decorators/auth.decorator';
import { AuthType } from '../auth/enums/auth-type.enum';
import { Roles } from 'src/decorators/roles.decorator';
import { UserRole } from './enum/user-role.enum';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles(UserRole.Staff)
  @Post()
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }
}
