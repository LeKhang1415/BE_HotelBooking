import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  typeRoomId: string;

  @IsNumber()
  pricePerDay: number;

  @IsNumber()
  pricePerHour: number;

  @IsOptional()
  @IsString()
  interior?: string;

  @IsOptional()
  @IsString()
  facilities?: string;
}
