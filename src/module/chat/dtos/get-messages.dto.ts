// dto/get-messages.dto.ts
import { IsOptional, IsString, IsInt, Min } from 'class-validator';

export class GetMessagesDto {
  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  limit: number = 30;
}
