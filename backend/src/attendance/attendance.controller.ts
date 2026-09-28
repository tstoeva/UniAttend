import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AttendanceService } from './attendance.service';
import { RfidCheckInDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';

@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private attendance: AttendanceService) {}

  // Извиква се от RFID моста (terminal/rfid_terminal.py)
  @Post('rfid-check-in')
  @Roles(Role.LECTURER)
  rfidCheckIn(@Body() dto: RfidCheckInDto) {
    return this.attendance.checkInByRfid(dto.sessionId, dto.rfidUid);
  }
}
