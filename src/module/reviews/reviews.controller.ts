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

@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  async create(
    @User() user: UserInterface,
    @Body() createReviewDto: CreateReviewDto,
  ) {}

  @Get('room/:roomId')
  async getReviewsByRoom(
    @Param('roomId') roomId: string,
    @Query() getReviewDto: GetReviewDto,
  ) {}

  @Get('my-reviews')
  async getMyReviews(
    @User() user: UserInterface,
    @Query() getReviewDto: GetReviewDto,
  ) {}

  @Post(':id')
  async update(
    @Param('id') id: string,
    @User() user: UserInterface,
    @Body() updateReviewDto: UpdateReviewDto,
  ) {}

  @Delete(':id')
  async delete(@Param('id') id: number, @User() user: UserInterface) {}

  @Get('room/:roomId/stats')
  async getRoomStats(@Param('roomId') roomId: string) {}
}
