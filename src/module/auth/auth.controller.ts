import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dtos/register.dto';
import { LogInUserDto } from './dtos/login.dto';
import { Auth } from 'src/decorators/auth.decorator';
import { AuthType } from './enums/auth-type.enum';
import { Request, Response } from 'express';
import { User } from 'src/decorators/user.decorator';
import { UserInterface } from '../users/interfaces/user.interface';
import { UpdateCurrentUserDto } from './dtos/update-current-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Auth(AuthType.None)
  @Post('register')
  @HttpCode(HttpStatus.OK)
  async register(
    @Body() registerUserDto: RegisterUserDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.handleRegister(registerUserDto, response);
  }

  @Auth(AuthType.None)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginUserDto: LogInUserDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.handleLogIn(loginUserDto, response);
  }

  @Auth(AuthType.None)
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.refreshToken(request, response);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) response: Response) {
    return this.authService.logout(response);
  }

  @Get('get-me')
  async getCurrentUser(@User() user: UserInterface) {
    return this.authService.getCurrentUser(user.sub);
  }

  @Post('update-me')
  async updateCurrentUser(
    @User() user: UserInterface,
    @Body() updateCurrentUserDto: UpdateCurrentUserDto,
  ) {
    return this.authService.updateCurrentUser(user.sub, updateCurrentUserDto);
  }
}
