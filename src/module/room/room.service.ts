import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Room } from './entities/room.entity';
import { In, Repository } from 'typeorm';
import { TypeRoom } from '../type-room/entities/type-room.entity';
import { PaginationProvider } from 'src/common/pagination/providers/pagination.provider';
import { CreateRoomDto } from './dtos/create-room.dto';
import { UpdateRoomDto } from './dtos/update-room.dto';
import { Paginated } from 'src/common/pagination/interfaces/paginated.interface';
import { GetRoomDto } from './dtos/get-room.dto';
import { RoomStatus } from './enums/room-status.enum';
import { Booking } from '../booking/entities/booking.entity';
import { BookingStatus } from '../booking/enums/bookingStatus';
import { FindAvailableRoomDto } from './dtos/find-available-room.dto';

@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,

    @InjectRepository(TypeRoom)
    private readonly typeRoomRepository: Repository<TypeRoom>,

    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,

    private readonly paginationProvider: PaginationProvider,
  ) {}

  public async create(createRoomDto: CreateRoomDto): Promise<Room> {
    // Kiểm tra xem tên phòng đã tồn tại chưa
    const existingRoom = await this.roomRepository.findOne({
      where: { name: createRoomDto.name },
    });

    if (existingRoom) {
      throw new BadRequestException('Tên phòng đã tồn tại');
    }

    // Kiểm tra xem loại phòng có tồn tại không
    const typeRoom = await this.typeRoomRepository.findOne({
      where: { id: createRoomDto.typeRoomId },
    });

    if (!typeRoom) {
      throw new NotFoundException('Không tìm thấy loại phòng');
    }

    const room = this.roomRepository.create({
      ...createRoomDto,
      typeRoom: { id: createRoomDto.typeRoomId },
    });

    return await this.roomRepository.save(room);
  }

  public async update(id: string, updateRoomDto: UpdateRoomDto): Promise<Room> {
    const room = await this.findOne(id);

    // Nếu có thay đổi tên phòng thì kiểm tra trùng lặp
    if (updateRoomDto.name && updateRoomDto.name !== room.name) {
      const existingRoom = await this.roomRepository.findOne({
        where: { name: updateRoomDto.name },
      });

      if (existingRoom) {
        throw new BadRequestException('Tên phòng đã tồn tại');
      }
    }

    // Nếu có thay đổi loại phòng thì kiểm tra lại
    if (
      updateRoomDto.typeRoomId &&
      updateRoomDto.typeRoomId !== room.typeRoom.id
    ) {
      const typeRoom = await this.typeRoomRepository.findOne({
        where: { id: updateRoomDto.typeRoomId },
      });

      if (!typeRoom) {
        throw new NotFoundException('Không tìm thấy loại phòng');
      }

      room.typeRoom = typeRoom;
    }

    // Cập nhật các trường khác
    Object.assign(room, updateRoomDto);

    return await this.roomRepository.save(room);
  }

  public async findOne(id: string): Promise<Room> {
    const room = await this.roomRepository.findOne({
      where: { id },
      relations: ['typeRoom', 'bookings'],
    });

    if (!room) {
      throw new NotFoundException('Không tìm thấy phòng');
    }

    return room;
  }

  public async findAll(
    typeRoomId: string,
    getRoomDto: GetRoomDto,
  ): Promise<Paginated<Room>> {
    const {
      status,
      minPrice,
      maxPrice,
      priceType,
      numberOfPeople,
      ...pagination
    } = getRoomDto;

    let queryBuilder = this.roomRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.typeRoom', 'typeRoom');

    if (typeRoomId) {
      queryBuilder.andWhere('typeRoom.id =:typeRoomId', { typeRoomId });
    }

    if (status) {
      queryBuilder.andWhere('room.roomStatus =:status', { status });
    }

    if (minPrice != null && maxPrice != null && priceType) {
      const priceField = `room.pricePer${priceType.charAt(0).toUpperCase() + priceType.slice(1)}`;

      queryBuilder.andWhere(`${priceField} BETWEEN :minPrice AND :maxPrice`, {
        minPrice,
        maxPrice,
      });
    }

    if (numberOfPeople != null) {
      queryBuilder.andWhere('typeRoom.maxPeople >= :numberOfPeople', {
        numberOfPeople,
      });
    }

    return await this.paginationProvider.paginateQueryBuilder(
      pagination,
      queryBuilder,
    );
  }

  public async findAvailableRoomsInTime(
    typeRoomId: string,
    findAvailableRoomDto: FindAvailableRoomDto,
  ): Promise<Paginated<Room>> {
    const {
      startTime,
      endTime,
      minPrice,
      maxPrice,
      priceType,
      numberOfPeople,
      ...pagination
    } = findAvailableRoomDto;

    const conflictingBookings = await this.bookingRepository
      .createQueryBuilder('booking')
      .select('booking.room.id', 'roomId')
      .innerJoin('booking.room', 'room')
      .where('booking.bookingStatus NOT IN (:...cancelledStatuses)', {
        cancelledStatuses: [BookingStatus.Cancelled, BookingStatus.Rejected],
      })
      .andWhere(
        'booking.startTime < :endTime AND booking.endTime > :startTime',
        { startTime, endTime },
      )
      .getRawMany();

    const unavailableRoomIds = conflictingBookings.map(
      (booking) => booking.roomId,
    );

    let queryBuilder = this.roomRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.typeRoom', 'typeRoom')
      .where('room.roomStatus = :status', { status: RoomStatus.ACTIVE });

    if (unavailableRoomIds.length > 0) {
      queryBuilder.andWhere('room.id NOT IN (:...unavailableRoomIds)', {
        unavailableRoomIds,
      });
    }

    if (typeRoomId) {
      queryBuilder.andWhere('typeRoom.id = :typeRoomId', { typeRoomId });
    }

    if (minPrice != null && maxPrice != null && priceType) {
      const priceField = `room.pricePer${priceType.charAt(0).toUpperCase() + priceType.slice(1)}`;

      queryBuilder.andWhere(`${priceField} BETWEEN :minPrice AND :maxPrice`, {
        minPrice,
        maxPrice,
      });
    }
    if (numberOfPeople != null) {
      queryBuilder.andWhere('typeRoom.maxPeople >= :numberOfPeople', {
        numberOfPeople,
      });
    }

    return await this.paginationProvider.paginateQueryBuilder(
      pagination,
      queryBuilder,
    );
  }

  public async updateStatus(id: string, status: RoomStatus): Promise<Room> {
    const room = await this.findOne(id);

    // Kiểm tra logic nghiệp vụ
    if (status === RoomStatus.ACTIVE) {
      // Kiểm tra xem có booking nào đang check-in không
      const activeBooking = await this.bookingRepository.findOne({
        where: {
          room: { id },
          bookingStatus: In([BookingStatus.CheckedIn]),
        },
      });

      if (activeBooking) {
        throw new BadRequestException(
          'Không thể chuyển phòng sang trạng thái trống. Phòng hiện đang có khách ở.',
        );
      }
    }

    room.roomStatus = status;
    return await this.roomRepository.save(room);
  }
}
