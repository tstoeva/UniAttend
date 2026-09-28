import { Controller, Get } from '@nestjs/common';

// Проверка дали API-то работи (GET /api/health)
@Controller()
export class AppController {
  @Get('health')
  health() {
    return { ok: true, service: 'uniattend-backend', timestamp: new Date().toISOString() };
  }
}
