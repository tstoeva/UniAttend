import { IsString } from 'class-validator';

export class RfidCheckInDto {
  @IsString() sessionId!: string;
  @IsString() rfidUid!: string;
}
