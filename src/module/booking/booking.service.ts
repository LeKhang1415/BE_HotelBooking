import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Booking } from './entities/booking.entity';
import { Room } from '../room/entities/room.entity';
import {
  Between,
  FindOptionsOrder,
  FindOptionsWhere,
  Repository,
} from 'typeorm';
import { PaginationProvider } from 'src/common/pagination/providers/pagination.provider';
import { CreateBookingDto } from './dtos/create-booking.dto';
import { RoomService } from '../room/room.service';
import { BookingStatus } from './enums/booking-status';
import { Paginated } from 'src/common/pagination/interfaces/paginated.interface';
import { GetUserBookingDto } from './dtos/get-user-booking.dto';
import { User } from '../users/entities/user.entity';
import { PaginationQueryDto } from 'src/common/pagination/dtos/pagination-query.dto';
import { GetBookingByStatusDto } from './dtos/get-booking-by-status';

@Injectable()
export class BookingService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,

    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly paginationProvider: PaginationProvider,

    private readonly roomService: RoomService,
  ) {}

  public async create(createBookingDto: CreateBookingDto): Promise<Booking> {
    const { roomId, startTime, endTime, stayType, numberOfGuest, userId } =
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
      stayType,
      numberOfGuest,
      bookingStatus: BookingStatus.Unpaid,
      room,
      ...(userId && { user: { id: userId } }),
    });

    return await this.bookingRepository.save(booking);
  }

  public async findMyBooking(
    userId: string,
    bookingId: string,
  ): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { bookingId },
      relations: ['user'],
    });

    if (!booking) {
      throw new NotFoundException('Không tìm thấy booking');
    }

    if (booking?.user?.id !== userId || booking.user === null) {
      throw new ForbiddenException('Bạn không có quyền xem booking này');
    }

    return booking;
  }

  public async createMyBooking(
    createBookingDto: CreateBookingDto,
  ): Promise<Booking> {
    const { roomId, startTime, endTime, stayType, numberOfGuest, userId } =
      createBookingDto;

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

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
      stayType,
      numberOfGuest,
      bookingStatus: BookingStatus.Unpaid,
      room,
      user,
    });

    return await this.bookingRepository.save(booking);
  }

  public async getUserBooking(
    userId: string,
    getUserBookingDto: GetUserBookingDto,
  ): Promise<Paginated<Booking>> {
    const { status, ...pagination } = getUserBookingDto;

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

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

  public async rejectBooking(bookingId: string): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { bookingId },
      relations: ['room'],
    });

    if (!booking) {
      throw new NotFoundException('Không tìm thấy thông tin đặt phòng');
    }

    if (booking.bookingStatus === BookingStatus.Completed) {
      throw new BadRequestException('Không thể hủy vì đặt phòng đã hoàn tất');
    }

    if (booking.actualCheckIn) {
      throw new BadRequestException('Không thể hủy vì khách đã nhận phòng');
    }

    booking.bookingStatus = BookingStatus.Rejected;

    return await this.bookingRepository.save(booking);
  }

  public async findOne(id: string): Promise<Booking> {
    const room = await this.bookingRepository.findOne({
      where: { bookingId: id },
      relations: ['room', 'user'],
    });

    if (!room) {
      throw new NotFoundException('Không tìm thấy phòng');
    }

    return room;
  }

  public async findBookingByStatus(
    getBookingByStatusDto: GetBookingByStatusDto,
  ): Promise<Paginated<Booking>> {
    const { status, ...pagination } = getBookingByStatusDto;

    const where = {
      bookingStatus: status,
    };
    const relations = ['user', 'room'];
    const order: FindOptionsOrder<Booking> = { bookingDate: 'DESC' };

    return await this.paginationProvider.paginateQuery(
      pagination,
      this.bookingRepository,
      where,
      order,
      relations,
    );
  }

  public async cancelMyBooking(
    userId: string,
    bookingId: string,
  ): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: {
        bookingId,
        user: { id: userId }, // đảm bảo booking thuộc về người dùng
      },
      relations: ['room', 'user'],
    });

    if (!booking) {
      throw new NotFoundException('Không tìm thấy thông tin đặt phòng của bạn');
    }

    if (booking.bookingStatus === BookingStatus.Completed) {
      throw new BadRequestException('Không thể hủy vì đặt phòng đã hoàn tất');
    }

    if (booking.actualCheckIn) {
      throw new BadRequestException('Không thể hủy vì bạn đã nhận phòng');
    }

    booking.bookingStatus = BookingStatus.Cancelled;

    return await this.bookingRepository.save(booking);
  }

  public async findBookingToday(
    paginationQueryDto: PaginationQueryDto,
  ): Promise<Paginated<Booking>> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const where = {
      startTime: Between(today, tomorrow),
    };

    const relations = ['room', 'user'];

    return await this.paginationProvider.paginateQuery(
      paginationQueryDto,
      this.bookingRepository,
      where,
      {},
      relations,
    );
  }

  public async checkIn(bookingId: string): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { bookingId },
      relations: ['room', 'user'],
    });

    if (!booking) {
      throw new NotFoundException('Không tìm thấy thông tin đặt phòng');
    }

    if (
      booking.bookingStatus === BookingStatus.Cancelled ||
      booking.bookingStatus === BookingStatus.Rejected
    ) {
      throw new BadRequestException('Đặt phòng đã bị hủy hoặc từ chối');
    }

    if (booking.actualCheckIn) {
      throw new BadRequestException('Khách đã nhận phòng trước đó');
    }

    const now = new Date();

    // Có thể check-in sớm 30 phút
    const earliestCheckIn = new Date(
      booking.startTime.getTime() - 30 * 60 * 1000,
    );

    if (now < earliestCheckIn) {
      throw new BadRequestException(
        'Chưa đến thời gian nhận phòng (có thể nhận phòng sớm tối đa 30 phút)',
      );
    }

    booking.actualCheckIn = now;
    booking.bookingStatus = BookingStatus.CheckedIn;

    return await this.bookingRepository.save(booking);
  }

  public async checkOut(bookingId: string): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { bookingId },
      relations: ['room', 'user'],
    });

    if (!booking) {
      throw new NotFoundException('Không tìm thấy thông tin đặt phòng');
    }

    if (!booking.actualCheckIn) {
      throw new BadRequestException('Khách chưa nhận phòng');
    }

    if (booking.actualCheckOut) {
      throw new BadRequestException('Khách đã trả phòng trước đó');
    }

    if (
      booking.bookingStatus === BookingStatus.Cancelled ||
      booking.bookingStatus === BookingStatus.Rejected
    ) {
      throw new BadRequestException('Đặt phòng đã bị hủy hoặc từ chối');
    }

    const now = new Date();

    booking.actualCheckOut = now;
    booking.bookingStatus = BookingStatus.Completed;

    return await this.bookingRepository.save(booking);
  }

  public async markAsPaid(bookingId: string): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { bookingId },
      relations: ['room', 'user'],
    });

    if (!booking) {
      throw new NotFoundException('Không tìm thấy thông tin đặt phòng');
    }

    if (
      booking.bookingStatus === BookingStatus.Cancelled ||
      booking.bookingStatus === BookingStatus.Rejected
    ) {
      throw new BadRequestException(
        'Không thể cập nhật trạng thái cho booking đã hủy/từ chối',
      );
    }

    booking.bookingStatus = BookingStatus.Paid;

    return await this.bookingRepository.save(booking);
  }
}
