import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { StudentService } from './student.service';

// Адреси за студенти (/api/student) – само с роля STUDENT
@Controller('student')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.STUDENT)
export class StudentController {
  constructor(private student: StudentService) {}

  // Всички данни за студентския портал
  @Get('dashboard')
  dashboard(@Req() req: any) {
    return this.student.dashboard(req.user.sub);
  }

  // Изпращане на отговорите от Smart Catch-up теста
  @Post('catchups/:id/submit')
  submit(@Req() req: any, @Param('id') id: string, @Body() body: { answers: number[] }) {
    return this.student.submitCatchup(req.user.sub, id, body.answers ?? []);
  }
}
