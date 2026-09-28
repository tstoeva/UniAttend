import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto';

// Адреси за вход (/api/auth)
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  // Вход с имейл и парола
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password);
  }
}
