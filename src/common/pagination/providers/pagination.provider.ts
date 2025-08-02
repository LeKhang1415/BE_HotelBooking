import { Injectable } from '@nestjs/common';
import {
  FindManyOptions,
  FindOptionsOrder,
  FindOptionsWhere,
  ObjectLiteral,
  Repository,
} from 'typeorm';
import { PaginationQueryDto } from '../dtos/pagination-query.dto';
import { Paginated } from '../interfaces/paginated.interface';

@Injectable()
export class PaginationProvider {
  public async paginateQuery<T extends ObjectLiteral>(
    paginationQueryDto: PaginationQueryDto,
    repository: Repository<T>,
    where: FindOptionsWhere<T> | FindOptionsWhere<T>[] = {},
    order: FindOptionsOrder<T> = {},
    relation?: string[],
    select?: (keyof T)[],
  ): Promise<Paginated<T>> {
    const page = paginationQueryDto.page ?? 1;
    const limit = Math.min(paginationQueryDto.limit ?? 10, 100); // Giới hạn max 100 items

    const findOptions: FindManyOptions<T> = {
      where,
      order,
      skip: (page - 1) * limit,
      take: limit,
    };

    // Thêm relation và select nếu có

    if (relation) {
      findOptions.relations = relation;
    }

    if (select) {
      findOptions.select = select;
    }

    const [results, totalItems] = await repository.findAndCount(findOptions);

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
