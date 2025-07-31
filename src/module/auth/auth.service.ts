import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  RequestTimeoutException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { HashingProvider } from './providers/hashing.provider';
import { RegisterUserDto } from './dtos/register.dto';
import { User } from '../users/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { instanceToPlain } from 'class-transformer';
import { LogInUserDto } from './dtos/login.dto';
import { GenerateTokenProvider } from './providers/generate-token.provider';

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
  ) {}

  async handleRegister(registerUserDto: RegisterUserDto) {
    const existingUser = await this.usersService.checkUserExists(
      registerUserDto.email,
    );

    if (existingUser) {
      throw new ConflictException(
        `Người dùng với email ${registerUserDto.email} đã tồn tại`,
      );
    }

    // Tiến hành tạo người dùng mới
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
        {
          description: 'Lỗi kết nối đến cơ sở dữ liệu',
        },
      );
    }

    const { accessToken, refreshToken } =
      await this.generateTokenProvider.generateToken(newUser);

    const { id, name, email, role } = newUser;

    return {
      accessToken,
      refreshToken,
      user: {
        id,
        name,
        email,
        role,
      },
    };
  }

  public async handleLogIn(logInUserDto: LogInUserDto) {
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
      // So sánh mật khẩu người dùng nhập vào và mật khẩu đã lưu trong cơ sở dữ liệu
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

    // Nếu mật khẩu không khớp, ném ra lỗi
    if (!isEqual) {
      throw new BadRequestException(
        'Mật khẩu không chính xác, vui lòng thử lại.',
      );
    }

    const { accessToken, refreshToken } =
      await this.generateTokenProvider.generateToken(existingUser);

    const { id, name, email, role } = existingUser;

    return {
      accessToken,
      refreshToken,
      user: {
        id,
        name,
        email,
        role,
      },
    };
  }
}
