import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AttendanceService } from './attendance.service';
import { CheckInDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';

@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private attendance: AttendanceService) {}

  @Get('credential')
  @Roles(Role.STUDENT)
  credential(@Req() req: any) { return this.attendance.createStudentCredential(req.user.sub); }

  @Post('check-in')
  @Roles(Role.LECTURER)
  checkIn(@Body() dto: CheckInDto) { return this.attendance.checkIn(dto.sessionId, dto.credential); }
}
