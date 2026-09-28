import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';

// Модул за вход: JWT токени (валидни 8 часа) и guards за защита на адресите
@Global()
@Module({
  imports: [JwtModule.registerAsync({
    inject: [ConfigService],
    useFactory: (config: ConfigService) => ({ secret: config.getOrThrow('JWT_SECRET'), signOptions: { expiresIn: '8h' } }),
  })],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, RolesGuard],
  exports: [JwtModule, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
