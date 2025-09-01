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
  In,
  IsNull,
  LessThanOrEqual,
  MoreThanOrEqual,
  Not,
  Repository,
} from 'typeorm';
import { PaginationProvider } from 'src/common/pagination/providers/pagination.provider';
import {
  CreateBookingDto,
  CreateMyBookingDto,
} from './dtos/create-booking.dto';
import { RoomService } from '../room/room.service';
import { BookingStatus } from './enums/booking-status';
import { Paginated } from 'src/common/pagination/interfaces/paginated.interface';
import { GetUserBookingDto } from './dtos/get-user-booking.dto';
import { User } from '../users/entities/user.entity';
import { PaginationQueryDto } from 'src/common/pagination/dtos/pagination-query.dto';
import { GetBookingByStatusDto } from './dtos/get-booking-by-status';
import { GetAllBookingDto } from './dtos/get-booking.dto';
import { BookingType } from './enums/booking-type';
import { StayType } from './enums/stay-type';
import { CustomerService } from '../customer/customer.service';
import { BookingPreviewDto } from './dtos/booking-preview.dto';
import {
  UpdateBookingDto,
  UpdateMyBookingDto,
} from './dtos/update-booking.dto';
import { PaymentStatus } from '../payment/enums/payment-status.enum';

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

    private readonly customerService: CustomerService,
  ) {}

  public async create(createBookingDto: CreateBookingDto): Promise<Booking> {
    const { bookingType } = createBookingDto;

    if (!bookingType) {
      throw new BadRequestException('Loại đặt phòng là bắt buộc');
    }

    // Kiểm tra loại đặt phòng hợp lệ
    if (!Object.values(BookingType).includes(bookingType)) {
      throw new BadRequestException('Loại đặt phòng không hợp lệ');
    }

    return this.createBooking(createBookingDto);
  }

  // Cập nhật method createBooking để tính totalAmount
  private async createBooking(
    createBookingDto: CreateBookingDto,
  ): Promise<Booking> {
    const {
      roomId,
      startTime,
      endTime,
      stayType,
      numberOfGuest,
      customerFullName,
      customerPhone,
      customerEmail,
      customerIdentityCard,
      userId,
      bookingType,
    } = createBookingDto;

    // Kiểm tra thời gian đặt phòng
    this.validateBookingTime(startTime, endTime, stayType);

    // Tìm kiếm phòng
    const room = await this.roomRepository.findOne({
      where: { id: roomId, deleteAt: IsNull() },
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
        'Phòng không khả dụng trong khoảng thời gian đã chọn',
      );
    }

    // Tìm hoặc tạo khách hàng
    const customer = await this.customerService.findOrCreateCustomer({
      fullName: customerFullName,
      phone: customerPhone,
      email: customerEmail,
      identityCard: customerIdentityCard,
    });

    // Tính toán tổng tiền
    const totalAmount = this.calculateBookingAmount(
      room,
      startTime,
      endTime,
      stayType,
    );

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('Người dùng không tồn tại');
    }

    // Tạo booking với totalAmount
    const booking = this.bookingRepository.create({
      startTime,
      endTime,
      bookingType,
      stayType,
      numberOfGuest,
      totalAmount,
      bookingStatus: BookingStatus.Unpaid,
      room,
      customer,
      createdBy: user,
    });

    return await this.bookingRepository.save(booking);
  }

  async createMyBooking(
    createMyBookingDto: CreateMyBookingDto,
  ): Promise<Booking> {
    const createBookingDto: CreateBookingDto = {
      ...createMyBookingDto,
      bookingType: BookingType.ONLINE, // Mặc định là ONLINE
    };

    // Tái sử dụng logic từ createBooking
    return this.createBookingWithUserValidation(createBookingDto);
  }

  // Tách riêng method để validate user (dùng cho My Booking)
  private async createBookingWithUserValidation(
    createBookingDto: CreateBookingDto,
  ): Promise<Booking> {
    const { userId } = createBookingDto;

    // Kiểm tra user tồn tại
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    // Sử dụng lại logic từ createBooking
    const booking = await this.createBooking(createBookingDto);

    // Gán thêm user relation
    booking.user = user;

    return await this.bookingRepository.save(booking);
  }

  public async update(
    bookingId: string,
    updateBookingDto: UpdateBookingDto,
  ): Promise<Booking> {
    // Tìm booking cần update
    const existingBooking = await this.bookingRepository.findOne({
      where: { bookingId },
      relations: ['room', 'room.typeRoom', 'customer', 'user'],
    });

    if (!existingBooking) {
      throw new NotFoundException('Không tìm thấy booking');
    }

    // Kiểm tra trạng thái booking có thể update không
    if (
      existingBooking.bookingStatus === BookingStatus.CheckedIn ||
      existingBooking.bookingStatus === BookingStatus.Completed ||
      existingBooking.bookingStatus === BookingStatus.Cancelled
    ) {
      throw new BadRequestException(
        'Không thể cập nhật booking ở trạng thái này',
      );
    }

    return this.updateBooking(existingBooking, updateBookingDto);
  }

  public async updateMyBooking(
    bookingId: string,
    updateMyBookingDto: UpdateMyBookingDto,
    userId: string,
  ): Promise<Booking> {
    // Tìm booking cần update và kiểm tra
    const existingBooking = await this.bookingRepository.findOne({
      where: {
        bookingId,
        user: { id: userId },
      },
      relations: ['room', 'room.typeRoom', 'customer', 'user'],
    });

    if (!existingBooking) {
      throw new NotFoundException(
        'Không tìm thấy booking hoặc bạn không có quyền cập nhật',
      );
    }

    // Kiểm tra trạng thái
    if (
      existingBooking.bookingStatus === BookingStatus.CheckedIn ||
      existingBooking.bookingStatus === BookingStatus.Completed ||
      existingBooking.bookingStatus === BookingStatus.Cancelled
    ) {
      throw new BadRequestException(
        'Không thể cập nhật booking ở trạng thái này',
      );
    }

    return this.updateBooking(
      existingBooking,
      updateMyBookingDto as UpdateBookingDto,
    );
  }

  private async updateBooking(
    existingBooking: Booking,
    updateBookingDto: UpdateBookingDto,
  ): Promise<Booking> {
    const {
      roomId,
      startTime,
      endTime,
      stayType,
      numberOfGuest,
      customerFullName,
      customerPhone,
      customerEmail,
      customerIdentityCard,
      bookingType,
    } = updateBookingDto;

    let updatedRoom = existingBooking.room;
    let updatedCustomer = existingBooking.customer;
    let newTotalAmount = existingBooking.totalAmount;

    // --- Xác định thời gian mới ---
    let newStartTime = startTime || existingBooking.startTime;
    let newEndTime = endTime || existingBooking.endTime;
    let newStayType = stayType || existingBooking.stayType;

    // --- Kiểm tra có thay đổi gì không ---
    const isTimeChanged = !!(startTime || endTime || stayType);
    const isRoomChanged = !!(roomId && roomId !== existingBooking.room.id);

    // --- Luôn validate thời gian nếu có thay đổi thời gian hoặc phòng ---
    if (isTimeChanged || isRoomChanged) {
      // Validate thời gian với thông tin booking gốc
      this.validateBookingTime(
        newStartTime,
        newEndTime,
        newStayType,
        true,
        existingBooking.startTime, // originalStartTime
        existingBooking.endTime, // originalEndTime
      );

      // Lấy phòng mới nếu có thay đổi
      if (isRoomChanged) {
        const room = await this.roomRepository.findOne({
          where: { id: roomId, deleteAt: IsNull() },
          relations: ['typeRoom'],
        });

        if (!room) {
          throw new NotFoundException('Không tìm thấy phòng');
        }
        updatedRoom = room;
      }

      // Kiểm tra phòng có khả dụng không
      const isAvailable = await this.roomService.isRoomAvailable(
        updatedRoom.id,
        newStartTime,
        newEndTime,
        existingBooking.bookingId,
      );

      if (!isAvailable) {
        throw new BadRequestException(
          'Phòng không khả dụng trong khoảng thời gian đã chọn',
        );
      }

      // Tính lại tổng tiền
      newTotalAmount = this.calculateBookingAmount(
        updatedRoom,
        newStartTime,
        newEndTime,
        newStayType,
      );
    }

    const newNumberOfGuest = numberOfGuest || existingBooking.numberOfGuest;

    if (newNumberOfGuest <= 0) {
      throw new BadRequestException('Số lượng khách phải lớn hơn 0');
    }

    // Validate số lượng khách
    if (
      updatedRoom.typeRoom?.maxPeople &&
      newNumberOfGuest > updatedRoom.typeRoom.maxPeople
    ) {
      throw new BadRequestException(
        `Số lượng khách (${newNumberOfGuest}) vượt quá sức chứa của phòng (${updatedRoom.typeRoom.maxPeople})`,
      );
    }

    // --- Update customer nếu có thay đổi ---
    if (
      customerFullName ||
      customerPhone ||
      customerEmail ||
      customerIdentityCard
    ) {
      const customerData = {
        fullName: customerFullName || existingBooking.customer?.fullName || '',
        phone: customerPhone || existingBooking.customer?.phone || '',
        email: customerEmail || existingBooking.customer?.email || undefined,
        identityCard:
          customerIdentityCard ||
          existingBooking.customer?.identityCard ||
          undefined,
      };

      updatedCustomer =
        await this.customerService.findOrCreateCustomer(customerData);
    }

    // --- Save lại booking ---
    const updatedBooking = await this.bookingRepository.save({
      ...existingBooking,
      startTime: newStartTime,
      endTime: newEndTime,
      bookingType: bookingType || existingBooking.bookingType,
      stayType: newStayType,
      numberOfGuest: numberOfGuest || existingBooking.numberOfGuest,
      totalAmount: newTotalAmount,
      room: updatedRoom,
      customer: updatedCustomer,
      user: existingBooking.user,
    });

    return updatedBooking;
  }

  async previewBooking(
    bookingPreviewDto: BookingPreviewDto,
    isUpdate: boolean = false,
  ) {
    const { roomId, startTime, endTime, stayType, numberOfGuest, bookingId } =
      bookingPreviewDto;

    let existingBooking: Booking | undefined;

    // Nếu là update thì lấy booking gốc ra
    if (isUpdate && bookingId) {
      existingBooking =
        (await this.bookingRepository.findOne({
          where: { bookingId },
        })) ?? undefined;

      if (!existingBooking) {
        throw new NotFoundException('Booking gốc không tồn tại');
      }
    }

    const finalStartTime = startTime ?? existingBooking?.startTime;
    const finalEndTime = endTime ?? existingBooking?.endTime;

    // Validate thời gian
    this.validateBookingTime(
      finalStartTime,
      finalEndTime,
      stayType,
      isUpdate,
      existingBooking?.startTime,
      existingBooking?.endTime,
    );

    // Tìm phòng
    const room = await this.roomRepository.findOne({
      where: { id: roomId, deleteAt: IsNull() },
      relations: ['typeRoom'],
    });

    if (!room) {
      throw new NotFoundException('Không tìm thấy phòng');
    }

    // Kiểm tra sức chứa
    if (room.typeRoom?.maxPeople && numberOfGuest > room.typeRoom.maxPeople) {
      throw new BadRequestException(
        `Số khách tối đa cho phòng này là ${room.typeRoom.maxPeople}`,
      );
    }

    // Kiểm tra phòng khả dụng
    const isAvailable = await this.roomService.isRoomAvailable(
      room.id,
      finalStartTime,
      finalEndTime,
      isUpdate ? bookingId : undefined, // loại trừ chính nó khi update
    );

    if (!isAvailable) {
      throw new BadRequestException(
        'Phòng không khả dụng trong khoảng thời gian đã chọn',
      );
    }

    // Tính tổng tiền
    const totalAmountNumber = this.calculateBookingAmount(
      room,
      finalStartTime,
      finalEndTime,
      stayType,
    );

    return {
      startTime: finalStartTime,
      endTime: finalEndTime,
      stayType,
      numberOfGuest,
      totalAmount: totalAmountNumber,
      room,
    };
  }

  public async findMyBooking(
    userId: string,
    bookingId: string,
  ): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { bookingId },
      relations: ['user', 'room'],
    });

    if (!booking) {
      throw new NotFoundException('Không tìm thấy booking');
    }

    if (booking?.user?.id !== userId || booking.user === null) {
      throw new ForbiddenException('Bạn không có quyền xem booking này');
    }

    return booking;
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
    const booking = await this.bookingRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.room', 'room')
      .leftJoinAndSelect('room.typeRoom', 'typeRoom')
      .where('booking.bookingId = :bookingId', { bookingId })
      .getOne();

    if (!booking) {
      throw new NotFoundException('Không tìm thấy thông tin đặt phòng');
    }

    if (booking.bookingStatus === BookingStatus.Paid) {
      throw new BadRequestException('Không thể hủy vì đặt phòng đã thanh toán');
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
      relations: ['room', 'user', 'customer'],
    });

    if (!room) {
      throw new NotFoundException('Không tìm thấy phòng');
    }

    return room;
  }

  public async getAllBooking(
    getAllBookingDto: GetAllBookingDto,
  ): Promise<Paginated<Booking>> {
    const {
      status,
      bookingType,
      stayType,
      roomId,
      startDate,
      endDate,
      bookingDateFrom,
      bookingDateTo,
      ...pagination
    } = getAllBookingDto;

    const where: FindOptionsWhere<Booking> = {};

    // Filter by status
    if (status) {
      where.bookingStatus = status;
    }

    // Filter by booking type
    if (bookingType) {
      where.bookingType = bookingType;
    }

    // Filter by stay type
    if (stayType) {
      where.stayType = stayType;
    }

    // Filter by room
    if (roomId) {
      where.room = { id: roomId };
    }

    // Filter by booking period (startTime - endTime)
    if (startDate && endDate) {
      where.startTime = Between(new Date(startDate), new Date(endDate));
    } else if (startDate) {
      where.startTime = Between(new Date(startDate), new Date());
    }

    // Filter by booking creation date
    if (bookingDateFrom && bookingDateTo) {
      where.bookingDate = Between(bookingDateFrom, bookingDateTo);
    } else if (bookingDateFrom) {
      where.bookingDate = Between(bookingDateFrom, new Date());
    }

    const relations = ['user', 'room', 'room.typeRoom', 'payments', 'customer'];
    const order: FindOptionsOrder<Booking> = {
      createdDate: 'DESC',
      bookingDate: 'DESC',
    };

    return await this.paginationProvider.paginateQuery(
      pagination,
      this.bookingRepository,
      where,
      order,
      relations,
    );
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

  async findCheckinCheckoutToday(
    paginationQueryDto: PaginationQueryDto,
  ): Promise<Paginated<Booking>> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const excludeStatus = [BookingStatus.Cancelled, BookingStatus.Rejected];

    const where = [
      {
        startTime: LessThanOrEqual(tomorrow),
        endTime: MoreThanOrEqual(today),
        bookingStatus: Not(In(excludeStatus)),
      },
    ];

    const relations = ['room', 'user', 'room.typeRoom', 'customer'];

    return await this.paginationProvider.paginateQuery(
      paginationQueryDto,
      this.bookingRepository,
      where,
      {},
      relations,
    );
  }

  async getTodayOccupancySummary() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const excludeStatus = [BookingStatus.Cancelled, BookingStatus.Rejected];

    const where = {
      startTime: LessThanOrEqual(tomorrow),
      endTime: MoreThanOrEqual(today),
      bookingStatus: Not(In(excludeStatus)),
    };

    const [total, checkedIn, waiting, completed] = await Promise.all([
      this.bookingRepository.count({ where }),
      this.bookingRepository.count({
        where: { ...where, bookingStatus: BookingStatus.CheckedIn },
      }),
      this.bookingRepository.count({
        where: [
          { ...where, bookingStatus: BookingStatus.Paid },
          { ...where, bookingStatus: BookingStatus.Unpaid },
        ],
      }),
      this.bookingRepository.count({
        where: { ...where, bookingStatus: BookingStatus.Completed },
      }),
    ]);

    return {
      total,
      checkedIn,
      waiting,
      completed,
    };
  }

  async checkIn(bookingId: string): Promise<Booking> {
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

    if (booking.bookingStatus !== BookingStatus.Paid) {
      throw new BadRequestException('Phải thanh toán trước khi nhận phòng');
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

  async checkOut(bookingId: string): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { bookingId },
      relations: ['room', 'user', 'payments'],
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

    // --- TÍNH PHỤ PHÍ CHECK-OUT TRỄ ---
    const lateFee = this.calculateLateFee(booking, now);

    if (lateFee > 0) {
      booking.extraCharges = (booking.extraCharges || 0) + lateFee;
      booking.totalAmount = Number(booking.totalAmount) + lateFee;
    }

    // --- XÁC ĐỊNH TRẠNG THÁI ---
    const totalPaid =
      booking.payments
        ?.filter((p) => p.status === PaymentStatus.SUCCESS)
        .reduce((sum, p) => sum + p.amount, 0) || 0;

    if (totalPaid < booking.totalAmount) {
      // Nếu chưa thanh toán đủ (ví dụ phụ phí chưa trả)
      booking.bookingStatus = BookingStatus.CheckedOutPendingPayment;
    } else {
      // Nếu đã thanh toán hết
      booking.bookingStatus = BookingStatus.Completed;
    }

    return await this.bookingRepository.save(booking);
  }

  async markAsPaid(bookingId: string): Promise<Booking> {
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

  private validateBookingTime(
    startTime: Date,
    endTime: Date,
    stayType: StayType,
    isUpdate = false,
    originalStartTime?: Date,
    originalEndTime?: Date,
  ) {
    if (startTime >= endTime) {
      throw new BadRequestException(
        'Thời gian bắt đầu phải trước thời gian kết thúc',
      );
    }

    const now = new Date();

    if (isUpdate) {
      // Nếu startTime thay đổi → check quá khứ
      if (
        originalStartTime &&
        startTime.getTime() !== originalStartTime.getTime() &&
        startTime < now
      ) {
        throw new BadRequestException(
          'Không thể đặt thời gian bắt đầu trong quá khứ khi cập nhật',
        );
      }

      // Nếu endTime thay đổi → check quá khứ
      if (
        originalEndTime &&
        endTime.getTime() !== originalEndTime.getTime() &&
        endTime < now
      ) {
        throw new BadRequestException(
          'Không thể đặt thời gian kết thúc trong quá khứ khi cập nhật',
        );
      }
    } else {
      // Khi tạo mới: không cho phép startTime trong quá khứ
      if (startTime.getTime() <= now.getTime()) {
        throw new BadRequestException(
          'Thời gian bắt đầu không được là thời điểm trong quá khứ',
        );
      }
    }

    // check duration
    const diffMs = endTime.getTime() - startTime.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (stayType === StayType.DAILY && diffHours < 24) {
      throw new BadRequestException(
        'Đặt phòng theo ngày phải ít nhất 1 ngày (24 giờ)',
      );
    }

    if (stayType === StayType.HOURLY && diffHours < 1) {
      throw new BadRequestException('Đặt phòng theo giờ phải ít nhất 1 giờ');
    }
  }

  private calculateBookingAmount(
    room: Room,
    startTime: Date,
    endTime: Date,
    stayType: StayType,
  ): number {
    const diffMs = endTime.getTime() - startTime.getTime();
    const totalHours = diffMs / (1000 * 60 * 60);
    const totalDays = totalHours / 24;

    // Luôn làm tròn lên để không thiệt hại cho khách sạn
    const billingHours = Math.ceil(totalHours);
    const billingDays = Math.ceil(totalDays);

    if (stayType === StayType.HOURLY) {
      return this.calculateHourlyRate(room, billingHours);
    }

    if (stayType === StayType.DAILY) {
      return this.calculateDailyRate(
        room,
        totalDays,
        billingDays,
        billingHours,
      );
    }

    throw new BadRequestException('Loại lưu trú không hợp lệ');
  }

  /**
   * Tính giá theo giờ
   */
  private calculateHourlyRate(room: Room, billingHours: number): number {
    return billingHours * room.pricePerHour;
  }

  /**
   * Tính giá theo ngày với logic:
   * - Nếu < 0.5 ngày (12 tiếng): tính theo giờ (rẻ hơn)
   * - Nếu >= 0.5 ngày: tính theo ngày (làm tròn lên)
   */
  private calculateDailyRate(
    room: Room,
    actualDays: number,
    billingDays: number,
    billingHours: number,
  ): number {
    const HALF_DAY_THRESHOLD = 0.5; // 12 tiếng

    // Nếu thời gian < 12 tiếng, tính theo giờ sẽ rẻ hơn
    if (actualDays < HALF_DAY_THRESHOLD) {
      const hourlyPrice = billingHours * room.pricePerHour;
      const dailyPrice = billingDays * room.pricePerDay;

      // Chọn giá rẻ hơn cho khách hàng
      return Math.min(hourlyPrice, dailyPrice);
    }

    // Thời gian >= 12 tiếng, tính theo ngày
    return billingDays * room.pricePerDay;
  }
  private calculateLateFee(booking: Booking, now: Date): number {
    if (now <= booking.endTime) return 0;

    const lateMs = now.getTime() - booking.endTime.getTime();
    const lateHours = Math.ceil(lateMs / (1000 * 60 * 60)); // làm tròn lên theo giờ

    //  20% giá phòng mỗi giờ trễ
    const lateFeePerHour = Number(booking.room.pricePerHour) * 0.2;

    return lateHours * lateFeePerHour;
  }
}
