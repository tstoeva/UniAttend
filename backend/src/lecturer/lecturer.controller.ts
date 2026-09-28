import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { LecturerService } from './lecturer.service';
import { SyllabusDto } from './dto';

// Адреси за лектори (/api/lecturer) – само с роля LECTURER
@Controller('lecturer')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.LECTURER)
export class LecturerController {
  constructor(private lecturer: LecturerService) {}

  // Курсове, лекции и присъствия
  @Get('dashboard')
  dashboard(@Req() req: any) {
    return this.lecturer.dashboard(req.user.sub);
  }

  // Отваряне на лекция за чекиране
  @Post('sessions/:id/open')
  open(@Req() req: any, @Param('id') id: string) {
    return this.lecturer.openSession(req.user.sub, id);
  }

  // Затваряне на лекция
  @Post('sessions/:id/close')
  close(@Req() req: any, @Param('id') id: string) {
    return this.lecturer.closeSession(req.user.sub, id);
  }

  // Качване на конспект с темите на курса
  @Post('courses/:id/syllabus')
  uploadSyllabus(@Req() req: any, @Param('id') id: string, @Body() dto: SyllabusDto) {
    return this.lecturer.uploadSyllabus(req.user.sub, id, dto.content);
  }
}
