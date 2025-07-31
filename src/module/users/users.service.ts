import {
  ConflictException,
  Injectable,
  RequestTimeoutException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { HashingProvider } from '../auth/providers/hashing.provider';
import { CreateUserDto } from './dto/create-user.dto';
import { instanceToPlain } from 'class-transformer';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,

    // Inject HashingProvider
    private readonly hashingProvider: HashingProvider,
  ) {}

  public async create(createUserDto: CreateUserDto) {
    const existingUser = await this.checkUserExists(createUserDto.email);

    if (existingUser) {
      throw new ConflictException(
        `Người dùng với email ${createUserDto.email} đã tồn tại`,
      );
    }

    // Tiến hành tạo người dùng mới
    let newUser = this.usersRepository.create({
      ...createUserDto,
      password: await this.hashingProvider.hashPassword(createUserDto.password),
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

    return instanceToPlain(newUser);
  }

  async findByID(id: string) {
    const user = await this.usersRepository.findOne({
      where: { id },
    });

    // Nếu không tìm thấy user, trả về lỗi 404
    if (!user) {
      return null;
    }
    return user;
  }

  async checkUserExists(email: string) {
    const user = await this.usersRepository.findOne({
      where: { email },
    });

    // Nếu không tìm thấy user, trả về lỗi 404
    if (!user) {
      return null;
    }
    return user;
  }
}
