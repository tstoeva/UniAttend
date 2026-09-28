import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { LecturerController } from './lecturer.controller';
import { LecturerService } from './lecturer.service';

// Модул за лектора (използва AI модула при затваряне на лекция)
@Module({ imports: [AiModule], controllers: [LecturerController], providers: [LecturerService] })
export class LecturerModule {}
