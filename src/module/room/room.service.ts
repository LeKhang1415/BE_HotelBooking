import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Room } from './entities/room.entity';
import { In, IsNull, MoreThan, Not, Repository } from 'typeorm';
import { TypeRoom } from '../type-room/entities/type-room.entity';
import { PaginationProvider } from 'src/common/pagination/providers/pagination.provider';
import { CreateRoomDto } from './dtos/create-room.dto';
import { UpdateRoomDto } from './dtos/update-room.dto';
import { Paginated } from 'src/common/pagination/interfaces/paginated.interface';
import { GetRoomDto } from './dtos/get-room.dto';
import { RoomStatus } from './enums/room-status.enum';
import { Booking } from '../booking/entities/booking.entity';
import { BookingStatus } from '../booking/enums/booking-status';
import { FindAvailableRoomDto } from './dtos/find-available-room.dto';
import { UploadsService } from '../uploads/uploads.service';
import { CheckRoomAvailableDto } from './dtos/check-room-available.dto';

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

    private readonly uploadsService: UploadsService,
  ) {}

  public async create(
    createRoomDto: CreateRoomDto,
    file?: Express.Multer.File,
  ): Promise<Room> {
    // Kiểm tra tên phòng chỉ trong các room chưa xóa
    const existingRoom = await this.roomRepository.findOne({
      where: {
        name: createRoomDto.name,
        deleteAt: IsNull(),
      },
    });

    if (existingRoom) {
      throw new BadRequestException('Tên phòng đã tồn tại');
    }

    // Kiểm tra xem loại phòng có tồn tại không và loại phòng chỉ trong các record chưa xóa
    const typeRoom = await this.typeRoomRepository.findOne({
      where: { id: createRoomDto.typeRoomId, deleteAt: IsNull() },
    });

    if (!typeRoom) {
      throw new NotFoundException('Không tìm thấy loại phòng');
    }

    let imageUrl: string | undefined = undefined;

    // Nếu có file thì upload lên Cloudinary
    if (file) {
      const uploadResult =
        await this.uploadsService.uploadFileToCloudinary(file);
      imageUrl = uploadResult.path; // Gán lại cho biến imageUrl đã khai báo
    }

    const room = this.roomRepository.create({
      ...createRoomDto,
      typeRoom: { id: createRoomDto.typeRoomId },
      image: imageUrl,
    });

    return await this.roomRepository.save(room);
  }

  public async update(
    id: string,
    updateRoomDto: UpdateRoomDto,
    file?: Express.Multer.File,
  ): Promise<Room> {
    const room = await this.findOne(id);

    // Nếu có thay đổi tên phòng thì kiểm tra trùng lặp
    if (updateRoomDto.name && updateRoomDto.name !== room.name) {
      const existingRoom = await this.roomRepository.findOne({
        where: { name: updateRoomDto.name, deleteAt: IsNull(), id: Not(id) },
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
        where: { id: updateRoomDto.typeRoomId, deleteAt: IsNull() },
      });

      if (!typeRoom) {
        throw new NotFoundException('Không tìm thấy loại phòng');
      }

      room.typeRoom = typeRoom;
    }

    // Nếu có thay đổi status thì kiểm tra điều kiện
    if (updateRoomDto.status && updateRoomDto.status !== room.roomStatus) {
      await this.validateStatusChange(id, updateRoomDto.status);
    }
    // Xử lý upload file mới nếu có
    let newImageUrl: string | undefined = undefined;

    if (file) {
      try {
        // Upload file mới lên Cloudinary
        const uploadResult =
          await this.uploadsService.uploadFileToCloudinary(file);
        newImageUrl = uploadResult.path;
      } catch (uploadError) {
        throw new BadRequestException(
          'Lỗi khi upload file: ' + uploadError.message,
        );
      }
    }

    // Cập nhật các trường khác
    Object.assign(room, {
      ...updateRoomDto,
      // Chỉ update image nếu có file mới được upload
      ...(newImageUrl && { image: newImageUrl }),
    });

    return await this.roomRepository.save(room);
  }

  public async findOne(id: string): Promise<Room> {
    const room = await this.roomRepository.findOne({
      where: { id, deleteAt: IsNull() },
      relations: ['typeRoom', 'bookings'],
    });

    if (!room) {
      throw new NotFoundException('Không tìm thấy phòng');
    }

    return room;
  }

  async findAll(getRoomDto: GetRoomDto): Promise<Paginated<Room>> {
    const {
      status,
      minPrice,
      typeRoomId,
      maxPrice,
      priceType,
      numberOfPeople,
      ...pagination
    } = getRoomDto;

    let queryBuilder = this.roomRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.typeRoom', 'typeRoom')
      .where('room.deleteAt IS NULL')
      .andWhere('typeRoom.deleteAt IS NULL');

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
  async findAllRoomsWithoutPagination(): Promise<Room[]> {
    let queryBuilder = this.roomRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.typeRoom', 'typeRoom')
      .where('room.deleteAt IS NULL')
      .andWhere('typeRoom.deleteAt IS NULL')
      .orderBy('room.name', 'ASC');

    return await queryBuilder.getMany();
  }

  async findAvailableRoomsInTime(
    findAvailableRoomDto: FindAvailableRoomDto,
  ): Promise<Paginated<Room>> {
    const {
      startTime,
      endTime,
      minPrice,
      maxPrice,
      priceType,
      numberOfPeople,
      typeRoomId,
      ...pagination
    } = findAvailableRoomDto;

    // Convert sang Date
    const start = new Date(startTime);
    const end = new Date(endTime);

    // Validate thời gian
    if (start >= end) {
      throw new BadRequestException(
        'Thời gian bắt đầu phải trước thời gian kết thúc',
      );
    }

    if (start < new Date()) {
      throw new BadRequestException(
        'Thời gian bắt đầu không được là thời điểm trong quá khứ',
      );
    }

    const conflictingBookings = await this.bookingRepository
      .createQueryBuilder('booking')
      .select('booking.room.id', 'roomId')
      .innerJoin('booking.room', 'room')
      .where('booking.bookingStatus NOT IN (:...cancelledStatuses)', {
        cancelledStatuses: [BookingStatus.Cancelled, BookingStatus.Rejected],
      })
      .andWhere('room.deleteAt IS NULL')
      .andWhere(
        'booking.startTime < :endTime AND booking.endTime > :startTime',
        { startTime: start, endTime: end },
      )
      .getRawMany();

    const unavailableRoomIds = conflictingBookings.map(
      (booking) => booking.roomId,
    );

    let queryBuilder = this.roomRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.typeRoom', 'typeRoom')
      .where('room.roomStatus = :status', { status: RoomStatus.ACTIVE })
      .andWhere('room.deleteAt IS NULL')
      .andWhere('typeRoom.deleteAt IS NULL');

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

  async isRoomAvailable(
    roomId: string,
    startTime: Date,
    endTime: Date,
    excludeBookingId?: string,
  ): Promise<boolean> {
    // check room tồn tại
    const room = await this.roomRepository.findOne({
      where: { id: roomId, deleteAt: IsNull() },
    });

    if (!room) {
      throw new NotFoundException('Phòng không tồn tại hoặc đã bị xóa');
    }

    // check conflict bookings
    let query = this.bookingRepository
      .createQueryBuilder('booking')
      .where('booking.roomId = :roomId', { roomId })
      .andWhere('booking.bookingStatus NOT IN (:...cancelledStatuses)', {
        cancelledStatuses: [BookingStatus.Cancelled, BookingStatus.Rejected],
      })
      .andWhere(
        'booking.startTime < :endTime AND booking.endTime > :startTime',
        { startTime, endTime },
      );

    if (excludeBookingId) {
      query = query.andWhere('booking.bookingId != :excludeBookingId', {
        excludeBookingId,
      });
    }

    const conflictingBooking = await query.getOne();
    return !conflictingBooking;
  }

  async checkAvailability(
    roomId: string,
    checkRoomAvailableDto: CheckRoomAvailableDto,
  ) {
    const { startTime, endTime, excludeBookingId } = checkRoomAvailableDto;

    const available = await this.isRoomAvailable(
      roomId,
      startTime,
      endTime,
      excludeBookingId,
    );

    return { roomId, available };
  }

  public async remove(id: string): Promise<{ deleted: boolean; id: string }> {
    const room = await this.findOne(id);

    // Kiểm tra room có booking active không
    const activeBooking = await this.bookingRepository.findOne({
      where: {
        room: { id: room.id },
        bookingStatus: In([
          BookingStatus.CheckedIn,
          BookingStatus.Paid,
          BookingStatus.Unpaid,
        ]),
      },
    });

    if (activeBooking) {
      throw new BadRequestException(
        'Không thể xóa phòng. Phòng này đang có hoặc sẽ có đặt phòng trong tương lai.',
      );
    }

    await this.roomRepository.softDelete(id);
    return { deleted: true, id };
  }

  private async validateStatusChange(
    roomId: string,
    newStatus: RoomStatus,
  ): Promise<void> {
    // Nếu muốn chuyển sang MAINTENANCE hoặc INACTIVE
    if ([RoomStatus.MAINTENANCE, RoomStatus.INACTIVE].includes(newStatus)) {
      // Kiểm tra phòng đang có khách ở (checked in)
      const activeBooking = await this.bookingRepository.findOne({
        where: {
          room: { id: roomId },
          bookingStatus: In([BookingStatus.CheckedIn]),
        },
      });

      if (activeBooking) {
        throw new BadRequestException(
          `Không thể chuyển phòng sang trạng thái "${newStatus}". Phòng hiện đang có khách ở.`,
        );
      }

      // Kiểm tra các booking trong tương lai (các trạng thái còn hiệu lực)
      const futureBookings = await this.bookingRepository.find({
        where: {
          room: { id: roomId },
          bookingStatus: In([
            BookingStatus.Unpaid, // Chưa thanh toán nhưng booking còn hiệu lực
            BookingStatus.Paid, // Đã thanh toán, chắc chắn sẽ đến
          ]),
          startTime: MoreThan(new Date()), // Booking có ngày check-in sau hiện tại
        },
      });

      if (futureBookings.length > 0) {
        throw new BadRequestException(
          `Không thể chuyển phòng sang trạng thái "${newStatus}". Phòng có ${futureBookings.length} booking trong tương lai.`,
        );
      }
    }
  }
}
