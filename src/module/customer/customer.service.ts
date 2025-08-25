import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { PaginationProvider } from 'src/common/pagination/providers/pagination.provider';
import { PaginationQueryDto } from 'src/common/pagination/dtos/pagination-query.dto';
import { Paginated } from 'src/common/pagination/interfaces/paginated.interface';
import { UpdateCustomerInfoDto } from './dtos/update-customer.dto';

export interface SearchCustomerDto extends PaginationQueryDto {
  search?: string;
  phone?: string;
  identityCard?: string;
}

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,

    private readonly paginationProvider: PaginationProvider,
  ) {}

  async findAll(
    searchCustomerDto: SearchCustomerDto,
  ): Promise<Paginated<Customer>> {
    const { search, phone, identityCard, ...pagination } = searchCustomerDto;

    let where: any = {};

    if (search) {
      where = [
        { fullName: Like(`%${search}%`) },
        { phone: Like(`%${search}%`) },
        { email: Like(`%${search}%`) },
        { identityCard: Like(`%${search}%`) },
      ];
    }

    if (phone) {
      where = { phone: Like(`%${phone}%`) };
    }

    if (identityCard) {
      where = { identityCard: Like(`%${identityCard}%`) };
    }

    return await this.paginationProvider.paginateQuery(
      pagination,
      this.customerRepository,
      where,
      { createdAt: 'DESC' },
      ['bookings'],
    );
  }

  async findOne(id: string): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { id },
      relations: ['bookings', 'bookings.room', 'bookings.room.typeRoom'],
    });

    if (!customer) {
      throw new NotFoundException('Không tìm thấy khách hàng');
    }

    return customer;
  }

  async findByPhone(phone: string): Promise<Customer | null> {
    return await this.customerRepository.findOne({
      where: { phone },
      relations: ['bookings'],
    });
  }

  async findByIdentityCard(identityCard: string): Promise<Customer | null> {
    return await this.customerRepository.findOne({
      where: { identityCard },
      relations: ['bookings'],
    });
  }

  async update(
    id: string,
    updateCustomerDto: UpdateCustomerInfoDto,
  ): Promise<Customer> {
    const customer = await this.findOne(id);

    // Kiểm tra trùng lặp phone nếu có thay đổi
    if (updateCustomerDto.phone && updateCustomerDto.phone !== customer.phone) {
      const existingCustomer = await this.findByPhone(updateCustomerDto.phone);
      if (existingCustomer && existingCustomer.id !== id) {
        throw new BadRequestException('Số điện thoại đã tồn tại');
      }
    }

    // Kiểm tra trùng lặp identity card nếu có thay đổi
    if (
      updateCustomerDto.identityCard &&
      updateCustomerDto.identityCard !== customer.identityCard
    ) {
      const existingCustomer = await this.findByIdentityCard(
        updateCustomerDto.identityCard,
      );
      if (existingCustomer && existingCustomer.id !== id) {
        throw new BadRequestException('Số CMND/CCCD đã tồn tại');
      }
    }

    Object.assign(customer, updateCustomerDto);
    return await this.customerRepository.save(customer);
  }

  async findOrCreateCustomer(data: {
    fullName: string;
    phone: string;
    email?: string;
    identityCard?: string;
  }): Promise<Customer> {
    const { fullName, phone, email, identityCard } = data;

    let customer = await this.customerRepository.findOne({
      where: [{ phone }, { identityCard }],
    });

    if (!customer) {
      customer = this.customerRepository.create({
        fullName,
        phone,
        email,
        identityCard,
      });
    } else {
      // Cập nhật nếu có thay đổi
      customer.fullName = fullName;
      customer.email = email || customer.email;
    }

    return await this.customerRepository.save(customer);
  }
}
