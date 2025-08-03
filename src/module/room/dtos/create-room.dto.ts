export class CreateRoomDto {
  name: string;
  typeRoomId: string;
  pricePerDay: number;
  pricePerHour: number;
  interior?: string;
  image?: string;
  facilities?: string;
}
