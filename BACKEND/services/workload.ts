/**
 * services/workload.ts — Faculty workload services.
 *
 * Implements:
 *   - getWorkload
 */

import type { ApiResult, WorkloadRow } from '@shared/types';
import { db } from '../lib/db.js';
import { buildWorkloadRow } from '../engine/workload.js';
import { GetWorkloadInput } from '../schemas.js';

function unwrap<T>(val: T | T[] | null | undefined): T | null {
  if (!val) return null;
  return Array.isArray(val) ? val[0] || null : val;
}

/**
 * Calculates start and end of week (Monday to Friday dates in YYYY-MM-DD) for current date.
 */
function getCurrentWeekBounds(): { monDate: string; friDate: string } {
  const d = new Date();
  const dayOfWeek = d.getUTCDay(); // 0=Sun, 1=Mon...
  const monDiff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const mon = new Date(d);
  mon.setUTCDate(d.getUTCDate() + monDiff);
  const fri = new Date(mon);
  fri.setUTCDate(mon.getUTCDate() + 4);
  return {
    monDate: mon.toISOString().slice(0, 10),
    friDate: fri.toISOString().slice(0, 10),
  };
}

export async function getWorkload(
  input: unknown
): Promise<ApiResult<WorkloadRow[]>> {
  try {
    const parsed = GetWorkloadInput.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: `Invalid input: ${parsed.error.issues.map((i) => i.message).join('; ')}`,
      };
    }

    const { facultyId } = parsed.data;
    const supabase = db();

    let query = supabase
      .from('faculty_profiles')
      .select(`
        id,
        required_hours,
        max_hours,
        users!inner(name)
      `);

    if (facultyId) {
      query = query.eq('id', facultyId);
    }

    const { data: facultyList, error: facErr } = await query;

    if (facErr) {
      return { ok: false, error: `Failed to fetch faculty: ${facErr.message}` };
    }

    if (facultyId && (!facultyList || facultyList.length === 0)) {
      return { ok: false, error: 'Faculty profile not found' };
    }

    const { monDate, friDate } = getCurrentWeekBounds();
    const rows: WorkloadRow[] = [];

    for (const fac of (facultyList || []) as any[]) {
      const user = unwrap(fac.users);
      const facultyName = user?.name || 'Unknown';

      // 1. Assigned hours = count of timetable entries
      const { count: assignedCount } = await supabase
        .from('timetable')
        .select('id', { count: 'exact', head: true })
        .eq('faculty_id', fac.id);

      const assignedHours = assignedCount || 0;

      // 2. Extra hours = sum of span of confirmed extra lectures for current week
      const { data: extraData } = await supabase
        .from('extra_lectures')
        .select('open_slots!inner(date, slot_id, end_slot_id, time_slots!open_slots_slot_id_fkey(slot_no), end_time_slots:time_slots!open_slots_end_slot_id_fkey(slot_no))')
        .eq('faculty_id', fac.id)
        .eq('status', 'confirmed');

      let extraHours = 0;
      (extraData || []).forEach((row: any) => {
        const os = unwrap(row.open_slots);
        if (os && os.date >= monDate && os.date <= friDate) {
          const ts = unwrap(os.time_slots);
          const ets = unwrap(os.end_time_slots);
          const sNo = ts?.slot_no || 1;
          const eNo = ets?.slot_no || sNo;
          extraHours += eNo - sNo + 1;
        }
      });

      rows.push(
        buildWorkloadRow({
          facultyId: fac.id,
          facultyName,
          requiredHours: fac.required_hours,
          assignedHours,
          extraHours,
          maxHours: fac.max_hours,
        })
      );
    }

    return { ok: true, data: rows };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `getWorkload failed: ${message}` };
  }
}
