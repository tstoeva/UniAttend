import { Module } from '@nestjs/common';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';

// Модул за присъствия с RFID
@Module({ controllers: [AttendanceController], providers: [AttendanceService] })
export class AttendanceModule {}
