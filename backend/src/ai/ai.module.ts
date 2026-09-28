import { Module } from '@nestjs/common';
import { AiService } from './ai.service';

// AI Smart Catch-up (OpenAI)
@Module({ providers: [AiService], exports: [AiService] })
export class AiModule {}
