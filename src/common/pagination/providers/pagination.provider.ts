import { Injectable } from '@nestjs/common';
import { ObjectLiteral, Repository } from 'typeorm';
import { PaginationQueryDto } from '../dtos/pagination-query.dto';
import { Paginated } from '../interfaces/paginated.interface';

@Injectable()
export class PaginationProvider {
  public async paginateQuery<T extends ObjectLiteral>(
    paginationQueryDto: PaginationQueryDto,
    repository: Repository<T>,
  ): Promise<Paginated<T>> {
    const page = paginationQueryDto.page ?? 1;
    const limit = paginationQueryDto.limit ?? 10;

    const results = await repository.find({
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalItems = await repository.count();

    let finalResponse = {
      data: results,
      meta: {
        itemsPerPage: limit,
        totalItems: totalItems,
        currentPage: page,
        totalPages: Math.ceil(totalItems / limit),
      },
    };

    return finalResponse;
  }
}
