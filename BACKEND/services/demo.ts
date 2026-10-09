/**
 * services/demo.ts — Demo login users and database reset services.
 *
 * Implements:
 *   - getDemoUsers
 *   - resetDemo
 */

import type { ApiResult, DemoUser } from '@shared/types';
import { db } from '../lib/db.js';
import { GetDemoUsersInput, ResetDemoInput } from '../schemas.js';

// Fixed demo users
const DEMO_USERS: DemoUser[] = [
  {
    id: '10000000-0000-0000-0000-000000000001',
    name: 'Admin',
    role: 'admin',
  },
  {
    id: '10000000-0000-0000-0000-000000000002',
    name: 'Dr. Sharma',
    role: 'faculty',
    facultyId: '20000000-0000-0000-0000-000000000001',
  },
  {
    id: '10000000-0000-0000-0000-000000000003',
    name: 'Prof. Kaur',
    role: 'faculty',
    facultyId: '20000000-0000-0000-0000-000000000002',
  },
];

// Raw tuple data from shared/seed.sql (n, day, slot_no, c, s, f, r, b)
const RAW_SEED_ROWS: Array<[number, number, number, number, number, number, number, number | null]> = [
  // Monday (day 1)
  [1,1,1,1,5,1,5,1],[2,1,2,1,5,1,5,1],[3,1,3,1,2,5,1,null],[4,1,4,1,4,3,1,null],[5,1,5,1,1,1,1,null],[6,1,6,1,3,1,1,null],
  [7,1,3,2,5,1,5,2],[8,1,4,2,5,1,5,2],[9,1,1,2,3,3,2,null],[10,1,2,2,2,5,2,null],[11,1,5,2,4,3,2,null],[12,1,7,2,1,1,2,null],
  [13,1,1,3,11,2,6,3],[14,1,2,3,11,2,6,3],[15,1,3,3,8,4,3,null],[16,1,4,3,10,5,3,null],[17,1,5,3,7,2,3,null],[18,1,6,3,9,2,3,null],
  [19,1,3,4,11,2,6,4],[20,1,4,4,11,2,6,4],[21,1,1,4,8,4,4,null],[22,1,2,4,9,4,4,null],[23,1,5,4,10,5,4,null],[24,1,7,4,7,2,4,null],
  // Tuesday (day 2)
  [25,2,3,1,6,3,5,5],[26,2,4,1,6,3,5,5],[27,2,1,1,2,5,1,null],[28,2,2,1,1,1,1,null],[29,2,5,1,4,3,1,null],[30,2,6,1,3,1,1,null],
  [31,2,1,2,6,3,5,6],[32,2,2,2,6,3,5,6],[33,2,3,2,2,5,2,null],[34,2,4,2,1,1,2,null],[35,2,6,2,3,3,2,null],[36,2,7,2,4,3,2,null],
  [37,2,3,3,12,4,6,7],[38,2,4,3,12,4,6,7],[39,2,1,3,7,2,3,null],[40,2,2,3,10,5,3,null],[41,2,5,3,8,4,3,null],[42,2,6,3,9,2,3,null],
  [43,2,1,4,12,4,6,8],[44,2,2,4,12,4,6,8],[45,2,3,4,7,2,4,null],[46,2,4,4,10,5,4,null],[47,2,6,4,8,4,4,null],[48,2,7,4,9,4,4,null],
  // Wednesday (day 3)
  [49,3,1,1,5,1,5,9],[50,3,2,1,5,1,5,9],[51,3,3,1,2,5,1,null],[52,3,4,1,4,3,1,null],[53,3,5,1,3,1,1,null],
  [54,3,3,2,5,1,5,10],[55,3,4,2,5,1,5,10],[56,3,1,2,2,5,2,null],[57,3,2,2,4,3,2,null],[58,3,6,2,1,1,2,null],
  [59,3,1,3,11,2,6,11],[60,3,2,3,11,2,6,11],[61,3,4,3,10,5,3,null],[62,3,5,3,7,2,3,null],[63,3,6,3,8,4,3,null],
  [64,3,3,4,11,2,6,12],[65,3,4,4,11,2,6,12],[66,3,2,4,10,5,4,null],[67,3,5,4,9,4,4,null],[68,3,6,4,7,2,4,null],
  // Thursday (day 4)
  [69,4,3,1,6,3,5,13],[70,4,4,1,6,3,5,13],[71,4,1,1,2,5,1,null],[72,4,2,1,1,1,1,null],[73,4,5,1,4,3,1,null],
  [74,4,1,2,6,3,5,14],[75,4,2,2,6,3,5,14],[76,4,3,2,2,5,2,null],[77,4,4,2,1,1,2,null],[78,4,6,2,3,3,2,null],
  [79,4,3,3,12,4,6,15],[80,4,4,3,12,4,6,15],[81,4,1,3,9,2,3,null],[82,4,2,3,10,5,3,null],[83,4,5,3,8,4,3,null],
  [84,4,1,4,12,4,6,16],[85,4,2,4,12,4,6,16],[86,4,3,4,7,2,4,null],[87,4,4,4,10,5,4,null],[88,4,6,4,8,4,4,null],
  // Friday (day 5) - row 90 is Sharma, DBMS, CSE-3A, Room 101, slot 2
  [89,5,1,1,2,5,1,null],[90,5,2,1,1,1,1,null],[91,5,4,1,3,1,1,null],
  [92,5,3,2,2,5,2,null],[93,5,5,2,3,3,2,null],[94,5,6,2,4,3,2,null],
  [95,5,1,3,7,2,3,null],[96,5,3,3,9,2,3,null],[97,5,5,3,10,5,3,null],
  [98,5,4,4,8,4,4,null],[99,5,6,4,10,5,4,null],[100,5,7,4,9,4,4,null],
];

// ─── getDemoUsers ───────────────────────────────────────────────────

export async function getDemoUsers(
  input: unknown
): Promise<ApiResult<DemoUser[]>> {
  try {
    const parsed = GetDemoUsersInput.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: `Invalid input: ${parsed.error.issues.map((i) => i.message).join('; ')}`,
      };
    }

    return { ok: true, data: DEMO_USERS };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `getDemoUsers failed: ${message}` };
  }
}

// ─── resetDemo ──────────────────────────────────────────────────────

export async function resetDemo(
  input: unknown
): Promise<ApiResult<{ message: string }>> {
  try {
    const parsed = ResetDemoInput.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: `Invalid input: ${parsed.error.issues.map((i) => i.message).join('; ')}`,
      };
    }

    const supabase = db();

    // 1. Delete all transactional tables in FK dependency order
    await supabase.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('extra_lectures').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('open_slots').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('lab_bookings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('leave_requests').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('timetable').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // 2. Fetch time_slots mapping (slot_no -> slot_id)
    const { data: slotsData } = await supabase
      .from('time_slots')
      .select('id, slot_no');

    const slotMap = new Map<number, string>();
    (slotsData || []).forEach((ts: any) => {
      slotMap.set(ts.slot_no, ts.id);
    });

    // 3. Build 100 fixed timetable rows
    const timetableRows = RAW_SEED_ROWS.map(([n, day, slotNo, c, s, f, r, b]) => {
      const slotId =
        slotMap.get(slotNo) ||
        `a0000000-0000-0000-0000-${String(slotNo).padStart(12, '0')}`;

      return {
        id: `d0000000-0000-0000-0000-${String(n).padStart(12, '0')}`,
        day,
        slot_id: slotId,
        class_id: `40000000-0000-0000-0000-${String(c).padStart(12, '0')}`,
        subject_id: `30000000-0000-0000-0000-${String(s).padStart(12, '0')}`,
        faculty_id: `20000000-0000-0000-0000-${String(f).padStart(12, '0')}`,
        room_id: `50000000-0000-0000-0000-${String(r).padStart(12, '0')}`,
        block_id: b ? `b0000000-0000-0000-0000-${String(b).padStart(12, '0')}` : null,
      };
    });

    // 4. Insert 100 timetable rows in chunks of 50
    const chunkSize = 50;
    for (let i = 0; i < timetableRows.length; i += chunkSize) {
      const chunk = timetableRows.slice(i, i + chunkSize);
      const { error: insErr } = await supabase.from('timetable').insert(chunk);
      if (insErr) {
        return {
          ok: false,
          error: `Failed to insert timetable seed rows: ${insErr.message}`,
        };
      }
    }

    return {
      ok: true,
      data: { message: 'Demo data reset successfully with fixed 100-row timetable' },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `resetDemo failed: ${message}` };
  }
}
