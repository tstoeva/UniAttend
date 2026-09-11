import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AttendanceStatus, Role, SessionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { CreateSessionDto } from './dto';

@Injectable()
export class LecturerService {
  constructor(private prisma: PrismaService, private ai: AiService) {}

  private async lecturer(userId: string) {
    const l = await this.prisma.lecturerProfile.findUnique({ where: { userId } });
    if (!l) throw new NotFoundException('Lecturer profile not found');
    return l;
  }

  async dashboard(userId: string) {
    const lecturer = await this.lecturer(userId);
    return this.prisma.course.findMany({
      where: { lecturerId: lecturer.id },
      include: {
        sessions: { orderBy: { startsAt: 'desc' }, include: { attendance: { include: { student: { include: { user: true } } } }, materials: true } },
        enrollments: { include: { student: { include: { user: true } } } },
      }
    });
  }

  private async ownedSession(userId: string, sessionId: string) {
    const lecturer = await this.lecturer(userId);
    const session = await this.prisma.classSession.findUnique({ where: { id: sessionId }, include: { course: true } });
    if (!session) throw new NotFoundException('Session not found');
    if (session.course.lecturerId !== lecturer.id) throw new ForbiddenException();
    return session;
  }

  async createSession(userId: string, dto: CreateSessionDto) {
    const lecturer = await this.lecturer(userId);
    const course = await this.prisma.course.findUnique({ where: { id: dto.courseId } });
    if (!course || course.lecturerId !== lecturer.id) throw new ForbiddenException();
    return this.prisma.classSession.create({
      data: { courseId: dto.courseId, title: dto.title, startsAt: new Date(dto.startsAt), endsAt: new Date(dto.endsAt), room: dto.room }
    });
  }

  async openSession(userId: string, sessionId: string) {
    await this.ownedSession(userId, sessionId);
    return this.prisma.classSession.update({ where: { id: sessionId }, data: { status: SessionStatus.OPEN } });
  }

  async addMaterial(userId: string, sessionId: string, file: Express.Multer.File) {
    await this.ownedSession(userId, sessionId);
    if (!file) throw new BadRequestException('File is required');
    return this.prisma.material.create({
      data: { sessionId, title: file.originalname, fileName: file.filename, mimeType: file.mimetype, localPath: file.path }
    });
  }

  async closeSession(userId: string, sessionId: string) {
    const session = await this.ownedSession(userId, sessionId);
    const enrollments = await this.prisma.enrollment.findMany({ where: { courseId: session.courseId } });

    await this.prisma.classSession.update({ where: { id: sessionId }, data: { status: SessionStatus.CLOSED } });

    const absentStudentIds: string[] = [];
    for (const enrollment of enrollments) {
      const existing = await this.prisma.attendanceRecord.findUnique({
        where: { studentId_sessionId: { studentId: enrollment.studentId, sessionId } }
      });
      if (!existing) {
        await this.prisma.attendanceRecord.create({
          data: { studentId: enrollment.studentId, sessionId, status: AttendanceStatus.ABSENT }
        });
        absentStudentIds.push(enrollment.studentId);
      }
    }

    const catchups = [];
    for (const studentId of absentStudentIds) catchups.push(await this.ai.generateCatchup(sessionId, studentId));

    const issuedBadges: string[] = [];
    const course = await this.prisma.course.findUnique({ where: { id: session.courseId }, include: { badgeRules: true } });
    if (course) {
      const closedCount = await this.prisma.classSession.count({ where: { courseId: course.id, status: SessionStatus.CLOSED } });
      if (closedCount >= course.requiredSessions) {
        for (const enrollment of enrollments) {
          const presentCount = await this.prisma.attendanceRecord.count({
            where: { studentId: enrollment.studentId, session: { courseId: course.id }, status: AttendanceStatus.PRESENT }
          });
          for (const rule of course.badgeRules) {
            if (presentCount >= rule.requiredPresent) {
              const badge = await this.prisma.studentBadge.upsert({
                where: { studentId_badgeRuleId: { studentId: enrollment.studentId, badgeRuleId: rule.id } },
                create: { studentId: enrollment.studentId, badgeRuleId: rule.id },
                update: {},
              });
              issuedBadges.push(badge.id);
            }
          }
        }
      }
    }

    return { sessionId, absentCount: absentStudentIds.length, catchupsCreated: catchups.length, badgesIssued: issuedBadges.length };
  }

  async verifyBadge(code: string) {
    const badge = await this.prisma.studentBadge.findUnique({
      where: { verificationCode: code },
      include: { student: { include: { user: true } }, badgeRule: { include: { course: true } } }
    });
    if (!badge) return { valid: false };
    return {
      valid: true,
      student: `${badge.student.user.firstName} ${badge.student.user.lastName}`,
      facultyNumber: badge.student.facultyNumber,
      badge: badge.badgeRule.name,
      course: badge.badgeRule.course.name,
      benefit: badge.badgeRule.benefit,
      issuedAt: badge.issuedAt,
    };
  }
}
