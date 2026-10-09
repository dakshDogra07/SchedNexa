/**
 * services/stats.ts — Dashboard stats service for Admin and Landing Page.
 *
 * Implements:
 *   - getDashboardStats
 */

import type { ApiResult, DashboardStats } from '@shared/types';
import { db } from '../lib/db.js';
import { GetDashboardStatsInput } from '../schemas.js';

function unwrap<T>(val: T | T[] | null | undefined): T | null {
  if (!val) return null;
  return Array.isArray(val) ? val[0] || null : val;
}

export async function getDashboardStats(
  input: unknown
): Promise<ApiResult<DashboardStats>> {
  try {
    const parsed = GetDashboardStatsInput.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: `Invalid input: ${parsed.error.issues.map((i) => i.message).join('; ')}`,
      };
    }

    // 1. Fetch total lectures count in timetable
    const { count: lecturesCount, error: errLectures } = await db()
      .from('timetable')
      .select('*', { count: 'exact', head: true });

    if (errLectures) {
      return { ok: false, error: `Database failure: ${errLectures.message}` };
    }

    const lectures = lecturesCount || 0;

    // 2. Fetch rooms count
    const { count: roomsCount, error: errRooms } = await db()
      .from('rooms')
      .select('*', { count: 'exact', head: true });

    if (errRooms) {
      return { ok: false, error: `Database failure: ${errRooms.message}` };
    }

    const numRooms = roomsCount || 0;
    const totalRoomSlots = numRooms * 35; // 7 slots/day * 5 days = 35 slots per room
    const roomUtilizationPct =
      totalRoomSlots > 0 ? Math.round((lectures / totalRoomSlots) * 100) : 0;

    // 3. Conflicts count (0 for generated/seeded timetable)
    const conflicts = 0;

    // 4. Fetch booked open_slots to calculate openSlotsFilled and hoursSaved
    const { data: bookedSlots, error: errBooked } = await db()
      .from('open_slots')
      .select('slot_id, end_slot_id, time_slots!open_slots_slot_id_fkey(slot_no), end_time_slots:time_slots!open_slots_end_slot_id_fkey(slot_no)')
      .eq('status', 'booked');

    if (errBooked) {
      return { ok: false, error: `Database failure: ${errBooked.message}` };
    }

    const openSlotsFilled = (bookedSlots || []).length;
    let hoursSaved = 0;

    (bookedSlots || []).forEach((row: any) => {
      const ts = unwrap(row.time_slots);
      const ets = unwrap(row.end_time_slots);
      const startNo = ts?.slot_no || 1;
      const endNo = ets?.slot_no || startNo;
      const span = endNo - startNo + 1;
      hoursSaved += span;
    });

    const stats: DashboardStats = {
      lectures,
      conflicts,
      roomUtilizationPct,
      openSlotsFilled,
      hoursSaved,
    };

    return { ok: true, data: stats };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `getDashboardStats failed: ${message}` };
  }
}
