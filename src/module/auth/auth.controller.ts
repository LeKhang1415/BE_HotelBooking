import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dtos/register.dto';
import { LogInUserDto } from './dtos/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.OK)
  async register(@Body() registerUserDto: RegisterUserDto) {
    return this.authService.handleRegister(registerUserDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginUserDto: LogInUserDto) {
    return this.authService.handleLogIn(loginUserDto);
  }
}
