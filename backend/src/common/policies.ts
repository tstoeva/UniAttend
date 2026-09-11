import { SessionStatus } from '@prisma/client';

export function checkInAllowed(sessionStatus: SessionStatus, enrolled: boolean) {
  return sessionStatus === SessionStatus.OPEN && enrolled;
}

export function perfectAttendanceEligible(presentCount: number, requiredPresent: number, closedCount: number, requiredSessions: number) {
  return closedCount >= requiredSessions && presentCount >= requiredPresent;
}
