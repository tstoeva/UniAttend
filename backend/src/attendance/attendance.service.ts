import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AttendanceStatus, SessionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { checkInAllowed } from '../common/policies';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  async checkInByRfid(sessionId: string, rfidUid: string) {
    // UID-ът се пази без двоеточия и с главни букви
    const student = await this.prisma.studentProfile.findUnique({
      where: { rfidUid: rfidUid.replace(/:/g, '').toUpperCase() },
      include: { user: true },
    });
    if (!student) throw new NotFoundException('RFID card is not registered');

    const session = await this.prisma.classSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Session not found');

    const enrollment = await this.prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId: student.id, courseId: session.courseId } },
    });
    if (!checkInAllowed(session.status, !!enrollment)) {
      throw new BadRequestException(
        session.status !== SessionStatus.OPEN ? 'Session is not open for attendance' : 'Student is not enrolled in this course',
      );
    }

    // 15 минути толеранс след края на сесията
    const now = new Date();
    if (now > new Date(session.endsAt.getTime() + 15 * 60_000)) throw new BadRequestException('Check-in window has ended');

    // upsert: повторно сканиране не създава дубликат
    const record = await this.prisma.attendanceRecord.upsert({
      where: { studentId_sessionId: { studentId: student.id, sessionId } },
      create: { studentId: student.id, sessionId, status: AttendanceStatus.PRESENT, checkedAt: now, source: 'RFID' },
      update: { status: AttendanceStatus.PRESENT, checkedAt: now, source: 'RFID' },
    });
    return {
      ok: true,
      status: record.status,
      checkedAt: record.checkedAt,
      student: `${student.user.firstName} ${student.user.lastName}`,
      facultyNumber: student.facultyNumber,
    };
  }
}
