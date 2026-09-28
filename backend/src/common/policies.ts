import { SessionStatus } from '@prisma/client';

// Чекиране само в отворена сесия и само за записан в курса студент
export function checkInAllowed(sessionStatus: SessionStatus, enrolled: boolean) {
  return sessionStatus === SessionStatus.OPEN && enrolled;
}
