import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dtos/register.dto';
import { LogInUserDto } from './dtos/login.dto';
import { Auth } from 'src/decorators/auth.decorator';
import { AuthType } from './enums/auth-type.enum';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Auth(AuthType.None)
  @Post('register')
  @HttpCode(HttpStatus.OK)
  async register(@Body() registerUserDto: RegisterUserDto) {
    return this.authService.handleRegister(registerUserDto);
  }

  @Auth(AuthType.None)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginUserDto: LogInUserDto) {
    return this.authService.handleLogIn(loginUserDto);
  }
}
