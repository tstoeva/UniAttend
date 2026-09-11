import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { StudentService } from './student.service';

@Controller('student')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.STUDENT)
export class StudentController {
  constructor(private student: StudentService) {}
  @Get('dashboard') dashboard(@Req() req: any) { return this.student.dashboard(req.user.sub); }
  @Get('courses') courses(@Req() req: any) { return this.student.courses(req.user.sub); }
  @Get('catchups') catchups(@Req() req: any) { return this.student.catchups(req.user.sub); }
  @Post('catchups/:id/submit') submit(@Req() req: any, @Param('id') id: string, @Body() body: { answers: number[] }) {
    return this.student.submitCatchup(req.user.sub, id, body.answers ?? []);
  }
}
