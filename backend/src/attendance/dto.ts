import { IsString } from 'class-validator';

export class CheckInDto {
  @IsString() sessionId!: string;
  @IsString() credential!: string;
}
