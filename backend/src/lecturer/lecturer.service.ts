import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AttendanceStatus, SessionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { parseSyllabus } from './syllabus';

// Логика за лекторския панел
@Injectable()
export class LecturerService {
  constructor(private prisma: PrismaService, private ai: AiService) {}

  // Профилът на текущия лектор
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

  // Курсовете на лектора с лекциите, присъствията и записаните студенти
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

  // Отваря лекцията за 90 минути от момента
  async openSession(userId: string, sessionId: string) {
    await this.ownedSession(userId, sessionId);
    const startsAt = new Date();
    const endsAt = new Date(startsAt.getTime() + 90 * 60_000);
    return this.prisma.classSession.update({ where: { id: sessionId }, data: { status: SessionStatus.OPEN, startsAt, endsAt } });
  }

  // Записаните студенти без присъствие стават ABSENT и получават Smart Catch-up
  async closeSession(userId: string, sessionId: string) {
    const session = await this.ownedSession(userId, sessionId);
    // Записаните в курса студенти; лекцията се маркира като CLOSED
    const enrollments = await this.prisma.enrollment.findMany({ where: { courseId: session.courseId } });
    await this.prisma.classSession.update({ where: { id: sessionId }, data: { status: SessionStatus.CLOSED } });

    // Отсъстващи са записаните студенти без присъствие
    const records = await this.prisma.attendanceRecord.findMany({ where: { sessionId } });
    const absentIds = enrollments.map((e) => e.studentId).filter((id) => !records.some((r) => r.studentId === id));
    await this.prisma.attendanceRecord.createMany({
      data: absentIds.map((studentId) => ({ studentId, sessionId, status: AttendanceStatus.ABSENT })),
    });
    // Smart Catch-up за всеки отсъстващ (тестът се генерира веднъж за лекцията)
    for (const studentId of absentIds) await this.ai.generateCatchup(sessionId, studentId);

    return { sessionId, absentCount: absentIds.length, catchupsCreated: absentIds.length };
  }

  // Конспект: темите стават заглавия и описания на лекциите по реда им (Тема 1 → Лекция 1 и т.н.)
  async uploadSyllabus(userId: string, courseId: string, content: string) {
    const lecturer = await this.lecturer(userId);
    const course = await this.prisma.course.findUnique({ where: { id: courseId }, include: { sessions: { orderBy: { startsAt: 'asc' } } } });
    if (!course) throw new NotFoundException('Course not found');
    if (course.lecturerId !== lecturer.id) throw new ForbiddenException();

    // Броят на темите трябва да съвпада с броя на лекциите
    const topics = parseSyllabus(content);
    if (topics.length !== course.sessions.length) {
      throw new BadRequestException(`Конспектът трябва да съдържа ${course.sessions.length} теми във формат „## Тема N: Заглавие“, а съдържа ${topics.length}.`);
    }

    // Всички лекции се обновяват заедно (транзакция)
    await this.prisma.$transaction(course.sessions.map((session, i) =>
      this.prisma.classSession.update({ where: { id: session.id }, data: { title: topics[i].title, syllabus: topics[i].description || null } })));
    return { courseId, topics: topics.map((topic) => topic.title) };
  }
}
