import { SessionStatus } from '@prisma/client';
import { checkInAllowed, perfectAttendanceEligible } from './policies';

describe('attendance policies', () => {
  it('allows enrolled student only in open session', () => {
    expect(checkInAllowed(SessionStatus.OPEN, true)).toBe(true);
    expect(checkInAllowed(SessionStatus.CLOSED, true)).toBe(false);
    expect(checkInAllowed(SessionStatus.OPEN, false)).toBe(false);
  });

  it('does not issue perfect attendance before all required sessions are closed', () => {
    expect(perfectAttendanceEligible(5, 5, 4, 5)).toBe(false);
    expect(perfectAttendanceEligible(5, 5, 5, 5)).toBe(true);
    expect(perfectAttendanceEligible(4, 5, 5, 5)).toBe(false);
  });
});
