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

import { getDemoUsers, resetDemo } from './services/demo.js';
import { getLeaveImpact, markLeave } from './services/leave.js';
import {
  getNotifications,
  markNotificationRead,
} from './services/notifications.js';
import { bookSlot, checkConflicts, getOpenSlots } from './services/slots.js';
import {
  generateTimetable,
  getEffectiveSchedule,
  getTimetable,
  moveTimetableEntry,
} from './services/timetable.js';
import { getWorkload } from './services/workload.js';
import { getRoomAvailability } from './services/rooms.js';
import { getRecommendations } from './services/recommend.js';
import {
  listFaculty,
  listSubjects,
  listClasses,
  listRooms,
  upsertFaculty,
  upsertSubject,
  upsertClass,
  upsertRoom,
} from './services/setup.js';
import {
  createLabBooking,
  listLabBookings,
  decideLabBooking,
} from './services/labs.js';
import { getDashboardStats } from './services/stats.js';
import { getAnalytics } from './services/analytics.js';

// ─── Handlers registry ──────────────────────────────────────────────
export const handlers: Handlers = {
  ping,
  getDemoUsers,
  resetDemo,

  generateTimetable,
  getTimetable,
  getEffectiveSchedule,
  getLeaveImpact,
  markLeave,
  getOpenSlots,
  checkConflicts,
  bookSlot,
  getNotifications,
  markNotificationRead,

  getWorkload,

  getRoomAvailability,
  getRecommendations,
  listFaculty,
  listSubjects,
  listClasses,
  listRooms,
  upsertFaculty,
  upsertSubject,
  upsertClass,
  upsertRoom,
  moveTimetableEntry,
  createLabBooking,
  listLabBookings,
  decideLabBooking,
  getDashboardStats,
  getAnalytics,
};
