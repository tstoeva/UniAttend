import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StudentService {
  constructor(private prisma: PrismaService) {}

  private async profile(userId: string) {
    const student = await this.prisma.studentProfile.findUnique({
      where: { userId },
      include: { user: { select: { firstName: true, lastName: true } } },
    });
    if (!student) throw new NotFoundException('Student not found');
    return student;
  }

  async dashboard(userId: string) {
    const student = await this.profile(userId);
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
    const catchups = await this.prisma.catchupPackage.findMany({
      where: { studentId: student.id },
      include: { session: { include: { course: true } } },
      orderBy: { createdAt: 'desc' },
    });
    const badges = await this.prisma.studentBadge.findMany({
      where: { studentId: student.id },
      include: { badgeRule: { include: { course: true } } },
      orderBy: { issuedAt: 'desc' },
    });
    return { student, courses: enrollments.map((e) => e.course), catchups, badges };
  }

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
