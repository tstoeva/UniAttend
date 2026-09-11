import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AttendanceStatus, SessionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService, private jwt: JwtService, private config: ConfigService) {}

  async createStudentCredential(userId: string) {
    const student = await this.prisma.studentProfile.findUnique({ where: { userId }, include: { user: true } });
    if (!student) throw new NotFoundException('Student profile not found');
    const credential = await this.jwt.signAsync(
      { studentId: student.id, facultyNumber: student.facultyNumber, kind: 'student_credential' },
      { secret: this.config.getOrThrow<string>('CREDENTIAL_SECRET'), expiresIn: '180d' },
    );
    return { credential, student: { name: `${student.user.firstName} ${student.user.lastName}`, facultyNumber: student.facultyNumber } };
  }

  async checkIn(sessionId: string, credential: string) {
    let payload: any;
    try {
      payload = await this.jwt.verifyAsync(credential, { secret: this.config.getOrThrow<string>('CREDENTIAL_SECRET') });
    } catch {
      throw new BadRequestException('Invalid or expired student credential');
    }
    if (payload.kind !== 'student_credential') throw new BadRequestException('Invalid credential type');

    const session = await this.prisma.classSession.findUnique({ where: { id: sessionId }, include: { course: true } });
    if (!session) throw new NotFoundException('Session not found');
    if (session.status !== SessionStatus.OPEN) throw new BadRequestException('Session is not open for attendance');

    const enrollment = await this.prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId: payload.studentId, courseId: session.courseId } },
    });
    if (!enrollment) throw new BadRequestException('Student is not enrolled in this course');

    const now = new Date();
    if (now > new Date(session.endsAt.getTime() + 15 * 60_000)) throw new BadRequestException('Check-in window has ended');

    const record = await this.prisma.attendanceRecord.upsert({
      where: { studentId_sessionId: { studentId: payload.studentId, sessionId } },
      create: { studentId: payload.studentId, sessionId, status: AttendanceStatus.PRESENT, checkedAt: now },
      update: { status: AttendanceStatus.PRESENT, checkedAt: now },
      include: { student: { include: { user: true } } },
    });
    return {
      ok: true,
      status: record.status,
      checkedAt: record.checkedAt,
      student: `${record.student.user.firstName} ${record.student.user.lastName}`,
      facultyNumber: record.student.facultyNumber,
    };
  }
}
