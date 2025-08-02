import { IsEmpty, IsNotEmpty, IsNumber, Length } from 'class-validator';

export class CreateTypeRoomDto {
  @IsNotEmpty()
  @Length(1, 50, { message: 'Name is too long' })
  name: string;

  @IsNotEmpty()
  introduction: string;

  @IsNotEmpty()
  highlight: string;

  @IsNotEmpty()
  sizeRoom: number;

  @IsNotEmpty()
  beds: string;

  @IsNotEmpty()
  maxPeople: number;
}
