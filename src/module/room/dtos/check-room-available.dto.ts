import { IsDate, IsOptional, IsUUID } from 'class-validator';

export class CheckRoomAvailableDto {
  @IsDate({ message: 'startTime phải là kiểu ngày hợp lệ' })
  startTime: Date;

  @IsDate({ message: 'endTime phải là kiểu ngày hợp lệ' })
  endTime: Date;

  @IsOptional()
  @IsUUID()
  excludeBookingId?: string;
}
