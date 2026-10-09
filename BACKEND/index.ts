import type { ApiContract, ApiResult } from '../shared/types.js';
import { PingInput } from './schemas.js';

// ─── Handler type (matches docs/ARCHITECTURE.md exactly) ────────────
type Handlers = {
  [K in keyof ApiContract]: (
    input: unknown
  ) => Promise<ApiResult<ApiContract[K]['output']>>;
};

// ─── Stub for not-yet-implemented handlers ──────────────────────────
function notImplemented<T>(): Promise<ApiResult<T>> {
  return Promise.resolve({ ok: false, error: 'Not implemented yet' });
}

// ─── Implemented handlers ───────────────────────────────────────────

async function ping(
  input: unknown
): Promise<ApiResult<{ time: string }>> {
  try {
    const parsed = PingInput.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: `Invalid input: ${parsed.error.issues.map(i => i.message).join('; ')}` };
    }
    return { ok: true, data: { time: new Date().toISOString() } };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `ping failed: ${message}` };
  }
}

import { getLeaveImpact, markLeave } from './services/leave.js';
import {
  generateTimetable,
  getEffectiveSchedule,
  getTimetable,
} from './services/timetable.js';

// ─── Handlers registry ──────────────────────────────────────────────
export const handlers: Handlers = {
  ping,
  getDemoUsers: () => notImplemented(),
  resetDemo: () => notImplemented(),
  generateTimetable,
  getTimetable,
  getEffectiveSchedule,
  getLeaveImpact,
  markLeave,
  getOpenSlots: () => notImplemented(),
  checkConflicts: () => notImplemented(),
  bookSlot: () => notImplemented(),
  getNotifications: () => notImplemented(),
  markNotificationRead: () => notImplemented(),
  getWorkload: () => notImplemented(),
  getRoomAvailability: () => notImplemented(),
  getRecommendations: () => notImplemented(),
  listFaculty: () => notImplemented(),
  listSubjects: () => notImplemented(),
  listClasses: () => notImplemented(),
  listRooms: () => notImplemented(),
  upsertFaculty: () => notImplemented(),
  upsertSubject: () => notImplemented(),
  upsertClass: () => notImplemented(),
  upsertRoom: () => notImplemented(),
  moveTimetableEntry: () => notImplemented(),
  createLabBooking: () => notImplemented(),
  listLabBookings: () => notImplemented(),
  decideLabBooking: () => notImplemented(),
  getDashboardStats: () => notImplemented(),
  getAnalytics: () => notImplemented(),
};
