import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateTypeRoomDto } from './dtos/create-type-room.dto';
import { TypeRoom } from './entities/type-room.entity';
import { Between, FindOptionsWhere, IsNull, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginationProvider } from 'src/common/pagination/providers/pagination.provider';
import { GetTypeRoomDto } from './dtos/get-type-room.dto';
import { Paginated } from 'src/common/pagination/interfaces/paginated.interface';
import { UpdateTypeRoomDto } from './dtos/update-type-room.dto';

@Injectable()
export class TypeRoomService {
  constructor(
    @InjectRepository(TypeRoom)
    private readonly typeRoomRepository: Repository<TypeRoom>,

    private readonly paginationProvider: PaginationProvider,
  ) {}

  public async create(createTypeRoomDto: CreateTypeRoomDto): Promise<TypeRoom> {
    const existingTypeRoom = await this.typeRoomRepository.findOne({
      where: { name: createTypeRoomDto.name },
    });

    if (existingTypeRoom) {
      throw new BadRequestException('Tên loại phòng đã tồn tại.');
    }

    const typeRoom = this.typeRoomRepository.create(createTypeRoomDto);
    return await this.typeRoomRepository.save(typeRoom);
  }

  public async update(
    id: string,
    updateTypeRoomDto: UpdateTypeRoomDto,
  ): Promise<TypeRoom> {
    const typeRoom = await this.typeRoomRepository.findOneBy({ id: id });

    if (!typeRoom) {
      throw new NotFoundException('Không tìm thấy loại phòng cần cập nhật.');
    }

    if (updateTypeRoomDto.name && updateTypeRoomDto.name !== typeRoom.name) {
      const existingTypeRoom = await this.typeRoomRepository.findOne({
        where: { name: updateTypeRoomDto.name },
      });

      if (existingTypeRoom) {
        throw new BadRequestException('Tên loại phòng đã tồn tại.');
      }
    }

    Object.assign(typeRoom, updateTypeRoomDto);
    return await this.typeRoomRepository.save(typeRoom);
  }

  public async findAll(
    getTypeRoomDto: GetTypeRoomDto,
  ): Promise<Paginated<TypeRoom>> {
    const { maxPeople, sizeRoom, maxSize, ...pagination } = getTypeRoomDto;

    const where: FindOptionsWhere<TypeRoom> = {
      deleteAt: IsNull(),
    };
    if (maxPeople !== undefined && maxPeople > 0) where.maxPeople = maxPeople;
    if (sizeRoom !== undefined && sizeRoom > 0) where.sizeRoom = sizeRoom;
    if (maxSize !== undefined && maxSize > 0) {
      where.sizeRoom = Between(0, maxSize);
    }

    return this.paginationProvider.paginateQuery<TypeRoom>(
      pagination,
      this.typeRoomRepository,
      where,
      { sizeRoom: 'ASC' },
    );
  }

  async findOneById(id: string): Promise<TypeRoom> {
    const typeRoom = await this.typeRoomRepository.findOne({
      where: { id },
      relations: ['rooms'],
    });

    if (!typeRoom) {
      throw new NotFoundException('Không tìm thấy loại phòng.');
    }

    return typeRoom;
  }

  public async remove(id: string) {
    const typeRoom = await this.findOneById(id);

    // Kiểm tra có phòng nào đang dùng loại phòng này không
    if (typeRoom.rooms && typeRoom.rooms.length > 0) {
      throw new BadRequestException(
        `Cannot delete room type. There are  rooms using this type.`,
      );
    }

    await this.typeRoomRepository.softDelete(id);
    return { deleted: true, id };
  }
}
