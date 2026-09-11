import { IsDateString, IsString } from 'class-validator';
export class CreateSessionDto {
  @IsString() courseId!: string;
  @IsString() title!: string;
  @IsDateString() startsAt!: string;
  @IsDateString() endsAt!: string;
  @IsString() room!: string;
}
