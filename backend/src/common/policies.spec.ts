import { SessionStatus } from '@prisma/client';
import { checkInAllowed } from './policies';

describe('attendance policies', () => {
  it('allows enrolled student only in open session', () => {
    expect(checkInAllowed(SessionStatus.OPEN, true)).toBe(true);
    expect(checkInAllowed(SessionStatus.CLOSED, true)).toBe(false);
    expect(checkInAllowed(SessionStatus.OPEN, false)).toBe(false);
  });
});
