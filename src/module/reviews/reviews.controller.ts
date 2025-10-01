import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ReviewService } from './reviews.service';
import { CreateReviewDto } from './dtos/create-review.dto';
import { User } from 'src/decorators/user.decorator';
import { UserInterface } from '../users/interfaces/user.interface';
import { GetReviewDto } from './dtos/get-review.dto';
import { UpdateReviewDto } from './dtos/update-review.dto';
import { UserRole } from '../users/enum/user-role.enum';
import { Roles } from 'src/decorators/roles.decorator';
import { Auth } from 'src/decorators/auth.decorator';
import { AuthType } from '../auth/enums/auth-type.enum';

@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  async create(
    @User() user: UserInterface,
    @Body() createReviewDto: CreateReviewDto,
  ) {
    return await this.reviewService.create(user.sub, createReviewDto);
  }

  @Get()
  async findAll(@Query() getReviewDto: GetReviewDto) {
    return await this.reviewService.findAll(getReviewDto);
  }

  @Get('room/:roomId')
  async getReviewsByRoom(
    @Param('roomId') roomId: string,
    @Query() getReviewDto: GetReviewDto,
  ) {
    return await this.reviewService.getReviewsByRoom(roomId, getReviewDto);
  }

  @Get('my-reviews')
  async getMyReviews(
    @User() user: UserInterface,
    @Query() getReviewDto: GetReviewDto,
  ) {
    return await this.reviewService.getReviewsByUser(user.sub, getReviewDto);
  }

  @Post(':id')
  async update(
    @Param('id') id: string,
    @User() user: UserInterface,
    @Body() updateReviewDto: UpdateReviewDto,
  ) {
    return await this.reviewService.update(id, user.sub, updateReviewDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @User() user: UserInterface) {
    return await this.reviewService.delete(id, user.sub);
  }

  @Get(':id')
  async getReview(@Param() id: string) {
    return await this.reviewService.findOne(id);
  }

  @Roles(UserRole.Staff)
  @Post(':id/toggle-status')
  async toggleReviewStatus(@Param('id') id: string) {
    return await this.reviewService.toggleReviewStatus(id);
  }

  @Auth(AuthType.None)
  @Get('room/:roomId')
  async getPublicReviewsByRoom(
    @Param('roomId') roomId: string,
    @Query() getReviewDto: GetReviewDto,
  ) {
    return await this.reviewService.getReviewsByRoom(roomId, getReviewDto);
  }
}
