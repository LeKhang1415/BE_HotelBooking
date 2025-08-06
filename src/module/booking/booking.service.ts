import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Booking } from './entities/booking.entity';
import { Room } from '../room/entities/room.entity';
import { FindOptionsWhere, Repository } from 'typeorm';
import { PaginationProvider } from 'src/common/pagination/providers/pagination.provider';
import { CreateBookingDto } from './dtos/create-booking.dto';
import { RoomService } from '../room/room.service';
import { BookingStatus } from './enums/bookingStatus';
import { Paginated } from 'src/common/pagination/interfaces/paginated.interface';
import { GetUserBookingDto } from './dtos/get-user-booking.dto';

@Injectable()
export class BookingService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,

    private readonly paginationProvider: PaginationProvider,

    private readonly roomService: RoomService,
  ) {}

  public async create(createBookingDto: CreateBookingDto): Promise<Booking> {
    const { roomId, startTime, endTime, bookingType, numberOfGuest, userId } =
      createBookingDto;

    // Validate thời gian
    if (startTime >= endTime) {
      throw new BadRequestException(
        'Thời gian bắt đầu phải trước thời gian kết thúc',
      );
    }

    if (startTime < new Date()) {
      throw new BadRequestException(
        'Thời gian bắt đầu không được là thời điểm trong quá khứ',
      );
    }

    const room = await this.roomRepository.findOne({
      where: { id: roomId },
      relations: ['typeRoom'],
    });

    if (!room) {
      throw new NotFoundException('Không tìm thấy phòng');
    }
    // Kiểm tra phòng có khả dụng không
    const isAvailable = await this.roomService.isRoomAvailable(
      roomId,
      startTime,
      endTime,
    );

    if (!isAvailable) {
      throw new BadRequestException(
        'Room is not available for the selected time period',
      );
    }

    // Tạo booking
    const booking = this.bookingRepository.create({
      startTime,
      endTime,
      bookingType,
      numberOfGuest,
      bookingStatus: BookingStatus.Unpaid,
      room: { id: roomId },
      ...(userId && { user: { id: userId } }),
    });

    return await this.bookingRepository.save(booking);
  }

  public async getUserBooking(
    userId: string,
    getUserBookingDto: GetUserBookingDto,
  ): Promise<Paginated<Booking>> {
    const { status, ...pagination } = getUserBookingDto;

    const where: FindOptionsWhere<Booking> = { user: { id: userId } };

    if (status) {
      where.bookingStatus = status;
    }

    return await this.paginationProvider.paginateQuery(
      pagination,
      this.bookingRepository,
      where,
      { createdDate: 'ASC' },
      ['room', 'room.typeRoom'],
    );
  }
}
