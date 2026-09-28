import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { LecturerService } from './lecturer.service';

@Controller('lecturer')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.LECTURER)
export class LecturerController {
  constructor(private lecturer: LecturerService) {}

  @Get('dashboard')
  dashboard(@Req() req: any) {
    return this.lecturer.dashboard(req.user.sub);
  }

  @Post('sessions/:id/open')
  open(@Req() req: any, @Param('id') id: string) {
    return this.lecturer.openSession(req.user.sub, id);
  }

  @Post('sessions/:id/close')
  close(@Req() req: any, @Param('id') id: string) {
    return this.lecturer.closeSession(req.user.sub, id);
  }
}
