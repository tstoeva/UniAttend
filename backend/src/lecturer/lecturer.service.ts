import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AttendanceStatus, SessionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';

@Injectable()
export class LecturerService {
  constructor(private prisma: PrismaService, private ai: AiService) {}

  private async lecturer(userId: string) {
    const lecturer = await this.prisma.lecturerProfile.findUnique({ where: { userId } });
    if (!lecturer) throw new NotFoundException('Lecturer profile not found');
    return lecturer;
  }

  // Само сесии от курсовете на текущия лектор
  private async ownedSession(userId: string, sessionId: string) {
    const lecturer = await this.lecturer(userId);
    const session = await this.prisma.classSession.findUnique({ where: { id: sessionId }, include: { course: true } });
    if (!session) throw new NotFoundException('Session not found');
    if (session.course.lecturerId !== lecturer.id) throw new ForbiddenException();
    return session;
  }

  async dashboard(userId: string) {
    const lecturer = await this.lecturer(userId);
    return this.prisma.course.findMany({
      where: { lecturerId: lecturer.id },
      include: {
        lecturer: { select: { title: true, user: { select: { firstName: true, lastName: true } } } },
        sessions: { orderBy: { startsAt: 'desc' }, include: { attendance: { include: { student: { select: { id: true } } } } } },
        enrollments: { include: { student: { include: { user: { select: { id: true, firstName: true, lastName: true } } } } } },
      },
    });
  }

  async openSession(userId: string, sessionId: string) {
    await this.ownedSession(userId, sessionId);
    const startsAt = new Date();
    const endsAt = new Date(startsAt.getTime() + 90 * 60_000);
    return this.prisma.classSession.update({ where: { id: sessionId }, data: { status: SessionStatus.OPEN, startsAt, endsAt } });
  }

  // Записаните студенти без присъствие стават ABSENT и получават Smart Catch-up
  async closeSession(userId: string, sessionId: string) {
    const session = await this.ownedSession(userId, sessionId);
    const enrollments = await this.prisma.enrollment.findMany({ where: { courseId: session.courseId } });
    await this.prisma.classSession.update({ where: { id: sessionId }, data: { status: SessionStatus.CLOSED } });

    const records = await this.prisma.attendanceRecord.findMany({ where: { sessionId } });
    const absentIds = enrollments.map((e) => e.studentId).filter((id) => !records.some((r) => r.studentId === id));
    await this.prisma.attendanceRecord.createMany({
      data: absentIds.map((studentId) => ({ studentId, sessionId, status: AttendanceStatus.ABSENT })),
    });
    for (const studentId of absentIds) await this.ai.generateCatchup(sessionId, studentId);

    return { sessionId, absentCount: absentIds.length, catchupsCreated: absentIds.length };
  }
}
