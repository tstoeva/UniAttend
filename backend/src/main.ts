import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

// Стартира сървъра: CORS, префикс /api, валидация на входните данни и порт от .env
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: true, credentials: true });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  const port = Number(app.get(ConfigService).get('PORT') ?? 3000);
  await app.listen(port);
  console.log(`UniAttend API running on http://localhost:${port}/api`);
}
bootstrap();
