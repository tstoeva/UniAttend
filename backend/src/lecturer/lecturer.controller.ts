import { Body, Controller, Get, Param, Post, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { LecturerService } from './lecturer.service';
import { CreateSessionDto } from './dto';

@Controller('lecturer')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.LECTURER)
export class LecturerController {
  constructor(private lecturer: LecturerService) {}
  @Get('dashboard') dashboard(@Req() req: any) { return this.lecturer.dashboard(req.user.sub); }
  @Post('sessions') create(@Req() req: any, @Body() dto: CreateSessionDto) { return this.lecturer.createSession(req.user.sub, dto); }
  @Post('sessions/:id/open') open(@Req() req: any, @Param('id') id: string) { return this.lecturer.openSession(req.user.sub, id); }
  @Post('sessions/:id/close') close(@Req() req: any, @Param('id') id: string) { return this.lecturer.closeSession(req.user.sub, id); }

  @Post('sessions/:id/materials')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (_req, file, cb) => cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${extname(file.originalname)}`),
    }),
    limits: { fileSize: 20 * 1024 * 1024 },
  }))
  material(@Req() req: any, @Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    return this.lecturer.addMaterial(req.user.sub, id, file);
  }

  @Get('badges/verify/:code') verify(@Param('code') code: string) { return this.lecturer.verifyBadge(code); }
}
