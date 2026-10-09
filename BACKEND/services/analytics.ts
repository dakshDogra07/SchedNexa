/**
 * services/analytics.ts — Analytics datasets service for charts (Recharts).
 *
 * Implements:
 *   - getAnalytics
 */

import type { AnalyticsData, ApiResult, TimeSlot } from '@shared/types';
import { db } from '../lib/db.js';
import { GetAnalyticsInput } from '../schemas.js';

function unwrap<T>(val: T | T[] | null | undefined): T | null {
  if (!val) return null;
  return Array.isArray(val) ? val[0] || null : val;
}

export async function getAnalytics(
  input: unknown
): Promise<ApiResult<AnalyticsData>> {
  try {
    const parsed = GetAnalyticsInput.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: `Invalid input: ${parsed.error.issues.map((i) => i.message).join('; ')}`,
      };
    }

    // 1. Fetch time slots and timetable rows for peak-hour heatmap dataset
    const [{ data: timeSlots, error: errSlots }, { data: ttData, error: errTt }] =
      await Promise.all([
        db().from('time_slots').select('*').order('slot_no'),
        db().from('timetable').select('slot_id, day, time_slots!inner(slot_no)'),
      ]);

    if (errSlots || errTt) {
      const errMsg = errSlots?.message || errTt?.message || 'Database failure';
      return { ok: false, error: `Database failure: ${errMsg}` };
    }

    const slotsList = (timeSlots as TimeSlot[]) || [];
    const timetableRows = ttData || [];

    // Count lectures per slot_no
    const slotCounts = new Map<number, number>();
    timetableRows.forEach((row: any) => {
      const ts = unwrap(row.time_slots);
      const slotNo = ts?.slot_no;
      if (slotNo) {
        slotCounts.set(slotNo, (slotCounts.get(slotNo) || 0) + 1);
      }
    });

    const peakHourHeatmap = slotsList.map((s) => {
      const count = slotCounts.get(s.slot_no) || 0;
      return {
        slotNo: s.slot_no,
        timeLabel: `${s.start_time.slice(0, 5)}-${s.end_time.slice(0, 5)}`,
        lectures: count,
      };
    });

    // 2. Fetch open_slots grouped by status (open, booked, cancelled)
    const { data: openSlotsData, error: errOs } = await db()
      .from('open_slots')
      .select('status, slot_id, end_slot_id, time_slots!open_slots_slot_id_fkey(slot_no), end_time_slots:time_slots!open_slots_end_slot_id_fkey(slot_no)');

    if (errOs) {
      return { ok: false, error: `Database failure: ${errOs.message}` };
    }

    const openSlots = openSlotsData || [];

    let openCount = 0;
    let bookedCount = 0;
    let cancelledCount = 0;
    let totalHoursSaved = 0;

    openSlots.forEach((row: any) => {
      if (row.status === 'open') openCount++;
      else if (row.status === 'booked') {
        bookedCount++;
        const ts = unwrap(row.time_slots);
        const ets = unwrap(row.end_time_slots);
        const sNo = ts?.slot_no || 1;
        const eNo = ets?.slot_no || sNo;
        totalHoursSaved += eNo - sNo + 1;
      } else if (row.status === 'cancelled') cancelledCount++;
    });

    const openSlotsStatus = [
      { status: 'Open', count: openCount },
      { status: 'Booked', count: bookedCount },
      { status: 'Cancelled', count: cancelledCount },
    ];

    const hoursSavedTrend = [
      { period: 'Current Week', hoursSaved: totalHoursSaved },
    ];

    const analyticsData: AnalyticsData = {
      peakHourHeatmap,
      openSlotsStatus,
      hoursSavedTrend,
    };

    return { ok: true, data: analyticsData };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `getAnalytics failed: ${message}` };
  }
}
