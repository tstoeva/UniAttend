import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Логика за студентския портал
@Injectable()
export class StudentService {
  constructor(private prisma: PrismaService) {}

  // Студентският профил на текущия потребител (с име)
  private async profile(userId: string) {
    const student = await this.prisma.studentProfile.findUnique({
      where: { userId },
      include: { user: { select: { firstName: true, lastName: true } } },
    });
    if (!student) throw new NotFoundException('Student not found');
    return student;
  }

  // Данни за студентския портал
  async dashboard(userId: string) {
    const student = await this.profile(userId);
    // Курсовете на студента с лектора и лекциите (с неговите присъствия)
    const enrollments = await this.prisma.enrollment.findMany({
      where: { studentId: student.id },
      include: {
        course: {
          include: {
            lecturer: { select: { title: true, user: { select: { firstName: true, lastName: true } } } },
            sessions: { orderBy: { startsAt: 'asc' }, include: { attendance: { where: { studentId: student.id } } } },
          },
        },
      },
    });
    // Smart Catch-up пакетите, най-новите първи
    const catchups = await this.prisma.catchupPackage.findMany({
      where: { studentId: student.id },
      include: { session: { include: { course: true } } },
      orderBy: { createdAt: 'desc' },
    });
    // Значките на студента
    const badges = await this.prisma.studentBadge.findMany({
      where: { studentId: student.id },
      include: { badgeRule: { include: { course: true } } },
      orderBy: { issuedAt: 'desc' },
    });
    return { student, courses: enrollments.map((e) => e.course), catchups, badges };
  }

  // Оценява теста: брои верните отговори и записва резултата
  async submitCatchup(userId: string, id: string, answers: number[]) {
    const student = await this.profile(userId);
    const item = await this.prisma.catchupPackage.findFirst({ where: { id, studentId: student.id } });
    if (!item) throw new NotFoundException('Catch-up not found');
    const quiz = item.quiz as any[];
    const score = quiz.filter((q, i) => answers[i] === q.correctIndex).length;
    return this.prisma.catchupPackage.update({
      where: { id },
      data: { status: 'COMPLETED', score, maxScore: quiz.length, completedAt: new Date() },
    });
  }
}
