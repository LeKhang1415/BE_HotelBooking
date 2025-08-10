import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  RequestTimeoutException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { HashingProvider } from './providers/hashing.provider';
import { RegisterUserDto } from './dtos/register.dto';
import { User } from '../users/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LogInUserDto } from './dtos/login.dto';
import { GenerateTokenProvider } from './providers/generate-token.provider';
import { Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import jwtConfig from 'src/config/jwt.config';
import { ConfigType } from '@nestjs/config';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,

    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,

    // Inject HashingProvider
    private readonly hashingProvider: HashingProvider,

    private readonly generateTokenProvider: GenerateTokenProvider,

    private readonly jwtService: JwtService,

    // Inject cấu hình JWT từ file jwt.config.ts
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}

  public async handleRegister(
    registerUserDto: RegisterUserDto,
    response: Response,
  ) {
    const existingUser = await this.usersService.checkUserExists(
      registerUserDto.email,
    );

    if (existingUser) {
      throw new ConflictException(
        `Người dùng với email ${registerUserDto.email} đã tồn tại`,
      );
    }

    // Tạo người dùng mới
    let newUser = this.usersRepository.create({
      ...registerUserDto,
      password: await this.hashingProvider.hashPassword(
        registerUserDto.password,
      ),
    });

    try {
      newUser = await this.usersRepository.save(newUser);
    } catch (error) {
      console.error(error);
      throw new RequestTimeoutException(
        'Không thể xử lý yêu cầu của bạn ngay lúc này, vui lòng thử lại sau',
        { description: 'Lỗi kết nối đến cơ sở dữ liệu' },
      );
    }

    // Set refreshToken vào cookie và lấy accessToken
    const { accessToken } =
      await this.generateTokenProvider.generateTokenWithCookie(
        newUser,
        response,
      );

    const { id, name, email, role } = newUser;

    return {
      accessToken,
      user: { id, name, email, role },
    };
  }

  public async handleLogIn(logInUserDto: LogInUserDto, response: Response) {
    const existingUser = await this.usersService.checkUserExists(
      logInUserDto.email,
    );

    if (!existingUser) {
      throw new BadRequestException(
        `Người dùng với email ${logInUserDto.email} không tồn tại`,
      );
    }

    let isEqual: boolean = false;

    try {
      isEqual = await this.hashingProvider.comparePassword(
        logInUserDto.password,
        existingUser.password!,
      );
    } catch (error) {
      console.error(error);
      throw new RequestTimeoutException(
        'Không thể xử lý yêu cầu của bạn ngay lúc này, vui lòng thử lại sau',
        { description: 'Lỗi khi so sánh mật khẩu' },
      );
    }

    if (!isEqual) {
      throw new BadRequestException(
        'Mật khẩu không chính xác, vui lòng thử lại.',
      );
    }

    // Set refreshToken vào cookie và lấy accessToken
    const { accessToken } =
      await this.generateTokenProvider.generateTokenWithCookie(
        existingUser,
        response,
      );

    const { id, name, email, role } = existingUser;

    return {
      accessToken,
      user: { id, name, email, role },
    };
  }

  async refreshToken(request: Request, response: Response) {
    const refreshToken = request.cookies?.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException('Không tìm thấy refresh token');
    }

    try {
      // Giải mã refresh token và trích xuất `sub` (ID người dùng)
      const { sub } = await this.jwtService.verifyAsync<
        Pick<JwtPayload, 'sub'>
      >(refreshToken, {
        secret: this.jwtConfiguration.secret,
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
      });

      // Lấy thông tin người dùng từ DB
      const user = await this.usersService.findByID(sub);

      if (!user) {
        throw new UnauthorizedException('Người dùng không tồn tại');
      }

      // Tạo access token mới và set lại cookie
      const { accessToken } =
        await this.generateTokenProvider.generateTokenWithCookie(
          user,
          response,
        );

      return {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      };
    } catch (error) {
      this.generateTokenProvider.clearRefreshTokenCookie(response);

      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Refresh token đã hết hạn');
      }

      throw new UnauthorizedException('Refresh token không hợp lệ');
    }
  }

  async logout(response: Response) {
    this.generateTokenProvider.clearRefreshTokenCookie(response);
    return { message: 'Đăng xuất thành công' };
  }
}
