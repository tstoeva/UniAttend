import { Module } from '@nestjs/common';
import { StudentController } from './student.controller';
import { StudentService } from './student.service';

// Модул за студентския портал
@Module({ controllers: [StudentController], providers: [StudentService] })
export class StudentModule {}
