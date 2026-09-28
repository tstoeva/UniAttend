import { IsString } from 'class-validator';

// Входни данни от RFID моста
export class RfidCheckInDto {
  @IsString() sessionId!: string;
  @IsString() rfidUid!: string;
}
