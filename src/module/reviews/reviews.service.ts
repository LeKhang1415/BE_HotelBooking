import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Review } from './entities/review.entity';
import { Repository } from 'typeorm';
import { Booking } from '../booking/entities/booking.entity';
import { Room } from '../room/entities/room.entity';
import { CreateReviewDto } from './dtos/create-review.dto';
import { BookingStatus } from '../booking/enums/bookingStatus';
import { UpdateReviewDto } from './dtos/update-review.dto';
import { GetReviewDto } from './dtos/get-review.dto';
import { PaginationProvider } from 'src/common/pagination/providers/pagination.provider';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,

    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,

    @InjectRepository(Room)
    private roomRepository: Repository<Room>,

    private readonly paginationProvider: PaginationProvider,
  ) {}

  async create(
    userId: string,
    createReviewDto: CreateReviewDto,
  ): Promise<Review> {
    const { bookingId, rating, comment } = createReviewDto;
    const booking = await this.bookingRepository.findOne({
      where: { bookingId: bookingId },
      relations: ['user', 'room', 'review'],
    });

    if (!booking) {
      throw new NotFoundException('Không tìm thấy booking');
    }

    if (booking.user?.id !== userId) {
      throw new ForbiddenException('Bạn không có quyền review booking này');
    }

    if (booking.bookingStatus !== BookingStatus.Completed) {
      throw new BadRequestException(
        'Chỉ có thể review sau khi hoàn thành booking',
      );
    }

    // Kiểm tra đã review chưa
    if (booking.review) {
      throw new BadRequestException('Booking này đã được review rồi');
    }

    // Tạo review mới
    const review = this.reviewRepository.create({
      rating,
      comment,
      user: { id: userId },
      room: { id: booking.room.id },
      booking: { bookingId: bookingId },
    });

    return await this.reviewRepository.save(review);
  }

  async update(
    reviewId: string,
    userId: string,
    updateReviewDto: UpdateReviewDto,
  ): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId },
      relations: ['user', 'room'],
    });

    if (!review) {
      throw new NotFoundException('Không tìm thấy review');
    }

    // Kiểm tra quyền sở hữu
    if (review.user.id !== userId) {
      throw new ForbiddenException('Bạn không có quyền sửa review này');
    }

    // Cập nhật các trường
    Object.assign(review, updateReviewDto);

    return await this.reviewRepository.save(review);
  }

  async getReviewsByUser(userId: string, getReviewDto: GetReviewDto) {
    const {
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      page,
      limit,
    } = getReviewDto;

    const queryBuilder = this.reviewRepository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.room', 'room')
      .leftJoinAndSelect('review.booking', 'booking')
      .where('review.user.id = :userId', { userId })
      .andWhere('review.isActive = :isActive', { isActive: true });

    // Sorting
    queryBuilder.orderBy(`review.${sortBy}`, sortOrder);

    return await this.paginationProvider.paginateQueryBuilder(
      { page, limit },
      queryBuilder,
    );
  }

  async delete(reviewId: string, userId: string): Promise<void> {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId },
      relations: ['user', 'room'],
    });

    if (!review) {
      throw new NotFoundException('Không tìm thấy review');
    }

    // Kiểm tra quyền sở hữu
    if (review.user.id !== userId) {
      throw new ForbiddenException('Bạn không có quyền xóa review này');
    }

    // Soft delete - set isActive = false
    review.isActive = false;

    await this.reviewRepository.save(review);
  }

  async findOne(id: string): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { id, isActive: true },
      relations: ['user', 'room', 'booking'],
    });

    if (!review) {
      throw new NotFoundException('Không tìm thấy review');
    }

    return review;
  }

  async getReviewsByRoom(roomId: string, getReviewDto: GetReviewDto) {
    const {
      page = 1,
      limit = 10,
      rating,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = getReviewDto;

    // Kiểm tra room có tồn tại không
    const room = await this.roomRepository.findOne({ where: { id: roomId } });
    if (!room) {
      throw new NotFoundException('Không tìm thấy phòng');
    }

    const queryBuilder = this.reviewRepository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.user', 'user')
      .leftJoinAndSelect('review.booking', 'booking')
      .where('review.room.id = :roomId', { roomId })
      .andWhere('review.isActive = :isActive', { isActive: true });

    // Filter rating nếu có
    if (rating) {
      queryBuilder.andWhere('review.rating = :rating', { rating });
    }

    // Sorting
    queryBuilder.orderBy(`review.${sortBy}`, sortOrder);

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [reviews, total] = await queryBuilder.getManyAndCount();

    // Tính average rating
    const averageRating = await this.calculateAverageRating(roomId);

    return {
      reviews,
      total,
      averageRating,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async toggleReviewStatus(reviewId: string): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId },
      relations: ['room'],
    });

    if (!review) {
      throw new NotFoundException('Không tìm thấy review');
    }

    review.isActive = !review.isActive;

    return await this.reviewRepository.save(review);
  }

  /**
   * Tính average rating cho room
   */
  private async calculateAverageRating(roomId: string): Promise<number> {
    const result = await this.reviewRepository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'average')
      .where('review.room.id = :roomId', { roomId })
      .andWhere('review.isActive = :isActive', { isActive: true })
      .getRawOne();

    return result?.average
      ? parseFloat(parseFloat(result.average).toFixed(1))
      : 0;
  }
}
