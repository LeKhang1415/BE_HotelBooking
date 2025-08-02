import { Injectable } from '@nestjs/common';
import {
  FindManyOptions,
  FindOptionsOrder,
  FindOptionsWhere,
  ObjectLiteral,
  Repository,
  SelectQueryBuilder,
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
    relations?: string[],
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

    if (relations) {
      findOptions.relations = relations;
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

  // Sử dụng QueryBuilder
  public async paginateQueryBuilder<T extends ObjectLiteral>(
    paginationQueryDto: PaginationQueryDto,
    queryBuilder: SelectQueryBuilder<T>,
  ): Promise<Paginated<T>> {
    const page = paginationQueryDto.page ?? 1;
    const limit = Math.min(paginationQueryDto.limit ?? 10, 100);

    // Clone queryBuilder để không ảnh hưởng queryBuilder gốc vì getCount() tự động bỏ SELECT, ORDER BY, và chỉ giữ WHERE
    const cloneQueryBuilder = queryBuilder.clone();

    // Get total count
    const totalItems = await cloneQueryBuilder.getCount();

    // Áp dụng pagination cho data query
    const results = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      data: results,
      meta: {
        itemsPerPage: limit,
        totalItems: totalItems,
        currentPage: page,
        totalPages: Math.ceil(totalItems / limit),
      },
    };
  }
}
