import {
  ConflictException,
  Injectable,
  NotFoundException,
  RequestTimeoutException,
} from '@nestjs/common';
import { FindOptionsWhere, IsNull, Like, Not, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { HashingProvider } from '../auth/providers/hashing.provider';
import { CreateUserDto } from './dto/create-user.dto';
import { instanceToPlain } from 'class-transformer';
import { GetUserDto } from './dto/get-user.dto';
import { Paginated } from 'src/common/pagination/interfaces/paginated.interface';
import { PaginationProvider } from 'src/common/pagination/providers/pagination.provider';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,

    // Inject HashingProvider
    private readonly hashingProvider: HashingProvider,

    private readonly paginationProvider: PaginationProvider,
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
      where: { email, deletedAt: IsNull() },
    });

    // Nếu không tìm thấy user, trả về lỗi 404
    if (!user) {
      return null;
    }
    return user;
  }

  async getAllUser(getUserDto: GetUserDto): Promise<Paginated<User>> {
    const { search, ...pagination } = getUserDto;

    const where: FindOptionsWhere<User> = {
      name: Like(`%${search}%`),
      deletedAt: IsNull(),
    };

    return await this.paginationProvider.paginateQuery(
      pagination,
      this.usersRepository,
      where,
    );
  }

  async update(userId: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findByID(userId);

    if (!user) {
      throw new NotFoundException(`Không tìm thấy người dùng với ID ${userId}`);
    }

    // Kiểm tra email đã tồn tại (nếu có thay đổi email)
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.usersRepository.findOne({
        where: {
          email: updateUserDto.email,
          id: Not(userId), // loại trừ user hiện tại
          deletedAt: IsNull(),
        },
      });

      if (existingUser) {
        throw new ConflictException('Email đã tồn tại');
      }
    }

    // Hash password nếu có thay đổi
    if (updateUserDto.password) {
      updateUserDto.password = await this.hashingProvider.hashPassword(
        updateUserDto.password,
      );
    }

    // Cập nhật thông tin
    Object.assign(user, updateUserDto);

    return await this.usersRepository.save(user);
  }

  public async remove(id: string) {
    await this.usersRepository.softDelete(id);
    return { deleted: true, id };
  }
}
