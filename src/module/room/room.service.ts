import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Room } from './entities/room.entity';
import { Repository } from 'typeorm';
import { TypeRoom } from '../type-room/entities/type-room.entity';
import { PaginationProvider } from 'src/common/pagination/providers/pagination.provider';
import { CreateRoomDto } from './dtos/create-room.dto';
import { UpdateRoomDto } from './dtos/update-room.dto';
import { Paginated } from 'src/common/pagination/interfaces/paginated.interface';
import { GetRoomDto } from './dtos/get-room.dto';

@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,

    @InjectRepository(TypeRoom)
    private readonly typeRoomRepository: Repository<TypeRoom>,

    private readonly paginationProvider: PaginationProvider,
  ) {}

  public async create(createRoomDto: CreateRoomDto): Promise<Room> {
    // Kiểm tra tên phòng đã tồn tại
    const existingRoom = await this.roomRepository.findOne({
      where: { name: createRoomDto.name },
    });

    if (existingRoom) {
      throw new BadRequestException('Room name already exists');
    }

    // Kiểm tra loại phòng tồn tại
    const typeRoom = await this.typeRoomRepository.findOne({
      where: { id: createRoomDto.typeRoomId },
    });

    if (!typeRoom) {
      throw new NotFoundException('Room type not found');
    }

    const room = this.roomRepository.create({
      ...createRoomDto,
      typeRoom: { id: createRoomDto.typeRoomId },
    });

    return await this.roomRepository.save(room);
  }

  public async update(id: string, updateRoomDto: UpdateRoomDto): Promise<Room> {
    const room = await this.findOne(id);

    // Kiểm tra tên trùng lặp nếu có thay đổi tên
    if (updateRoomDto.name && updateRoomDto.name !== room.name) {
      const existingRoom = await this.roomRepository.findOne({
        where: { name: updateRoomDto.name },
      });

      if (existingRoom) {
        throw new BadRequestException('Room name already exists');
      }
    }

    // Kiểm tra loại phòng nếu có thay đổi
    if (
      updateRoomDto.typeRoomId &&
      updateRoomDto.typeRoomId !== room.typeRoom.id
    ) {
      const typeRoom = await this.typeRoomRepository.findOne({
        where: { id: updateRoomDto.typeRoomId },
      });

      if (!typeRoom) {
        throw new NotFoundException('Room type not found');
      }

      room.typeRoom = typeRoom;
    }

    // Cập nhật các field khác
    Object.assign(room, updateRoomDto);

    return await this.roomRepository.save(room);
  }

  public async findOne(id: string): Promise<Room> {
    const room = await this.roomRepository.findOne({
      where: { id },
      relations: ['typeRoom', 'bookings'],
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    return room;
  }
  public async findAll(getRoomDto: GetRoomDto): Promise<Paginated<Room>> {
    const { typeRoomId, status, minPrice, maxPrice, priceType, ...pagination } =
      getRoomDto;

    const queryBuilder = this.roomRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.typeRoom', 'typeRoom');

    if (typeRoomId) {
      queryBuilder.andWhere('room.typeRoomId =:typeRoomId', { typeRoomId });
    }

    if (status) {
      queryBuilder.andWhere('room.roomStatus =:status', { status });
    }
    if (minPrice && maxPrice && priceType) {
      const priceField = `room.pricePer${priceType.charAt(0).toUpperCase() + priceType.slice(1)}`;

      queryBuilder.andWhere(`${priceField} BETWEEN :minPrice AND :maxPrice`, {
        minPrice,
        maxPrice,
      });
    }

    return await this.paginationProvider.paginateQueryBuilder(
      pagination,
      queryBuilder,
    );
  }
}
