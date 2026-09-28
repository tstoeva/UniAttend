import { IsEmail, IsString, MinLength } from 'class-validator';

// Входни данни за вход (валидират се автоматично)
export class LoginDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(6) password!: string;
}
