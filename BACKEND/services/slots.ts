/**
 * services/slots.ts — Open Academic Slot services.
 *
 * Implements:
 *   - getOpenSlots
 *   - checkConflicts
 *   - bookSlot
 */

import type {
  ApiResult,
  CheckResult,
  ExtraLecture,
  OpenSlotView,
} from '@shared/types';
import { getUTCDayOfWeek } from '../lib/dates.js';
import { db } from '../lib/db.js';
import { busySlotsInSpan, ScheduleContext } from '../engine/availability.js';
import { runConflictChecks } from '../engine/conflicts.js';
import {
  BookSlotInput,
  CheckConflictsInput,
  GetOpenSlotsInput,
} from '../schemas.js';

function unwrap<T>(val: T | T[] | null | undefined): T | null {
  if (!val) return null;
  return Array.isArray(val) ? val[0] || null : val;
}

/**
 * Calculates start and end of week (Monday to Friday dates in YYYY-MM-DD) for a given date.
 */
function getWeekBounds(dateStr: string): { monDate: string; friDate: string } {
  const parts = dateStr.split('-').map(Number);
  const [year, month, day] = parts;
  const d = new Date(Date.UTC(year, month - 1, day));
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

/**
 * Builds ScheduleContext for a given entity (faculty, class, or room) on a specific date.
 */
async function buildScheduleContext(
  entityType: 'faculty' | 'class' | 'room',
  entityId: string,
  dateStr: string
): Promise<ScheduleContext> {
  const day = getUTCDayOfWeek(dateStr);
  const idCol = `${entityType}_id`;

  // 1. Timetable slot numbers on this weekday
  const { data: ttData } = await db()
    .from('timetable')
    .select('slot_id, time_slots!inner(slot_no)')
    .eq(idCol, entityId)
    .eq('day', day);

  const timetableSlotNos: number[] = Array.from(
    new Set(
      (ttData || []).map((row: any) => {
        const ts = unwrap(row.time_slots);
        return ts?.slot_no;
      }).filter((val): val is number => typeof val === 'number')
    )
  );

  // 2. Open slot numbers on this date (freed slots)
  const { data: osData } = await db()
    .from('open_slots')
    .select('slot_id, end_slot_id, time_slots!open_slots_slot_id_fkey(slot_no), end_time_slots:time_slots!open_slots_end_slot_id_fkey(slot_no)')
    .eq(idCol, entityId)
    .eq('date', dateStr)
    .neq('status', 'cancelled');

  const openSlotNosSet = new Set<number>();
  (osData || []).forEach((row: any) => {
    const ts = unwrap(row.time_slots);
    const ets = unwrap(row.end_time_slots);
    const sNo = ts?.slot_no;
    const eNo = ets?.slot_no || sNo;
    if (sNo && eNo) {
      for (let s = sNo; s <= eNo; s++) {
        openSlotNosSet.add(s);
      }
    }
  });

  // 3. Extra lecture slot numbers on this date (confirmed extra lectures)
  const { data: elData } = await db()
    .from('extra_lectures')
    .select('open_slots!inner(date, slot_id, end_slot_id, time_slots!open_slots_slot_id_fkey(slot_no), end_time_slots:time_slots!open_slots_end_slot_id_fkey(slot_no))')
    .eq(entityType === 'faculty' ? 'faculty_id' : 'open_slots.class_id', entityId)
    .eq('status', 'confirmed');

  const extraLectureSlotNosSet = new Set<number>();
  (elData || []).forEach((row: any) => {
    const os = unwrap(row.open_slots);
    if (os && os.date === dateStr) {
      const ts = unwrap(os.time_slots);
      const ets = unwrap(os.end_time_slots);
      const sNo = ts?.slot_no;
      const eNo = ets?.slot_no || sNo;
      if (sNo && eNo) {
        for (let s = sNo; s <= eNo; s++) {
          extraLectureSlotNosSet.add(s);
        }
      }
    }
  });

  // 4. Lab booking slot numbers on this date (approved lab bookings)
  const { data: lbData } = await db()
    .from('lab_bookings')
    .select('slot_id, end_slot_id, time_slots!lab_bookings_slot_id_fkey(slot_no), end_time_slots:time_slots!lab_bookings_end_slot_id_fkey(slot_no)')
    .eq(idCol, entityId)
    .eq('date', dateStr)
    .eq('status', 'approved');

  const labBookingSlotNosSet = new Set<number>();
  (lbData || []).forEach((row: any) => {
    const ts = unwrap(row.time_slots);
    const ets = unwrap(row.end_time_slots);
    const sNo = ts?.slot_no;
    const eNo = ets?.slot_no || sNo;
    if (sNo && eNo) {
      for (let s = sNo; s <= eNo; s++) {
        labBookingSlotNosSet.add(s);
      }
    }
  });

  return {
    timetableSlotNos,
    openSlotNos: Array.from(openSlotNosSet),
    extraLectureSlotNos: Array.from(extraLectureSlotNosSet),
    labBookingSlotNos: Array.from(labBookingSlotNosSet),
  };
}

/**
 * Calculates current total weekly hours for a faculty (assigned + confirmed extra lectures).
 */
async function getFacultyWeeklyWorkload(
  facultyId: string,
  dateStr: string
): Promise<number> {
  // 1. Assigned hours = count of timetable rows for faculty
  const { count: assignedCount } = await db()
    .from('timetable')
    .select('id', { count: 'exact', head: true })
    .eq('faculty_id', facultyId);

  const assignedHours = assignedCount || 0;

  // 2. Extra hours = sum of span of confirmed extra lectures in this week
  const { monDate, friDate } = getWeekBounds(dateStr);
  const { data: extraData } = await db()
    .from('extra_lectures')
    .select('open_slots!inner(date, slot_id, end_slot_id, time_slots!open_slots_slot_id_fkey(slot_no), end_time_slots:time_slots!open_slots_end_slot_id_fkey(slot_no))')
    .eq('faculty_id', facultyId)
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

  return assignedHours + extraHours;
}

// ─── getOpenSlots ───────────────────────────────────────────────────

export async function getOpenSlots(
  input: unknown
): Promise<ApiResult<OpenSlotView[]>> {
  try {
    const parsed = GetOpenSlotsInput.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: `Invalid input: ${parsed.error.issues.map((i) => i.message).join('; ')}`,
      };
    }

    const { facultyId, status } = parsed.data;

    if (facultyId) {
      const { data: fac, error: facErr } = await db()
        .from('faculty_profiles')
        .select('id')
        .eq('id', facultyId)
        .maybeSingle();

      if (facErr || !fac) {
        return { ok: false, error: 'Faculty profile not found' };
      }
    }

    let query = db()
      .from('open_slots')
      .select(`
        id,
        leave_request_id,
        timetable_id,
        date,
        slot_id,
        end_slot_id,
        class_id,
        room_id,
        original_faculty_id,
        status,
        time_slots!open_slots_slot_id_fkey(slot_no, start_time, end_time),
        end_time_slots:time_slots!open_slots_end_slot_id_fkey(slot_no, start_time, end_time),
        classes!inner(name, department, semester),
        rooms!inner(name, type),
        original_faculty:faculty_profiles!open_slots_original_faculty_id_fkey(
          users!inner(name)
        ),
        timetable!inner(
          subject_id,
          subjects!inner(name, type, department, semester)
        )
      `);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) {
      return { ok: false, error: `Failed to fetch open slots: ${error.message}` };
    }

    // Pre-fetch faculty data if facultyId is provided for scoring
    let facProfile: any = null;
    let facSubjectIds: string[] = [];
    if (facultyId) {
      const { data: fp } = await db()
        .from('faculty_profiles')
        .select('id, department, required_hours, max_hours')
        .eq('id', facultyId)
        .single();
      facProfile = fp;

      const { data: fsData } = await db()
        .from('faculty_subjects')
        .select('subject_id')
        .eq('faculty_id', facultyId);
      facSubjectIds = (fsData || []).map((fs: any) => fs.subject_id);
    }

    const openSlotViews: OpenSlotView[] = [];

    for (const row of (data || []) as any[]) {
      const ts = unwrap(row.time_slots);
      const ets = unwrap(row.end_time_slots);
      const cls = unwrap(row.classes);
      const rm = unwrap(row.rooms);
      const origFac = unwrap(row.original_faculty);
      const origFacUser = origFac ? unwrap(origFac.users) : null;
      const tt = unwrap(row.timetable);
      const subj = tt ? unwrap(tt.subjects) : null;

      const slotNo = ts?.slot_no || 1;
      const endSlotNo = ets?.slot_no || slotNo;
      const startTime = ts?.start_time || '';
      const endTime = ets?.end_time || ts?.end_time || '';
      const span = endSlotNo - slotNo + 1;

      let score: number | null = null;

      if (facultyId && facProfile) {
        // Calculate recommendation score (0-100 rule-based)
        let calcScore = 0;

        // 1. Available (+30): check if faculty is free at slotNos on that date
        const facCtx = await buildScheduleContext('faculty', facultyId, row.date);
        const slotNos = Array.from({ length: span }, (_, i) => slotNo + i);
        const isFree = busySlotsInSpan(facCtx, slotNos).length === 0;
        if (isFree) calcScore += 30;

        // 2. Can teach (+30): faculty has at least one subject in faculty_subjects matching the room type
        const canTeach = facSubjectIds.length > 0;
        if (canTeach) calcScore += 30;

        // 3. No conflict (+20): all conflict checks pass for at least 1 subject
        const currentWorkload = await getFacultyWeeklyWorkload(facultyId, row.date);
        const workloadOk = currentWorkload + span <= facProfile.max_hours;
        if (isFree && workloadOk) calcScore += 20;

        // 4. Class/semester suitable (+10): matching department or semester
        if (
          facProfile.department &&
          cls?.department &&
          facProfile.department === cls.department
        ) {
          calcScore += 10;
        }

        // 5. Workload below target (+10): assigned hours < required hours
        const assigned = await getFacultyWeeklyWorkload(facultyId, row.date);
        if (assigned < facProfile.required_hours) {
          calcScore += 10;
        }

        score = Math.min(100, Math.max(0, calcScore));
      }

      openSlotViews.push({
        id: row.id,
        leaveRequestId: row.leave_request_id,
        timetableId: row.timetable_id,
        date: row.date,
        slotId: row.slot_id,
        endSlotId: row.end_slot_id,
        slotNo,
        endSlotNo,
        startTime,
        endTime,
        span,
        classId: row.class_id,
        className: cls?.name || '',
        roomId: row.room_id,
        roomName: rm?.name || '',
        originalFacultyId: row.original_faculty_id,
        originalFacultyName: origFacUser?.name || '',
        originalSubjectId: tt?.subject_id || '',
        originalSubjectName: subj?.name || '',
        status: row.status,
        score,
      });
    }

    return { ok: true, data: openSlotViews };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `getOpenSlots failed: ${message}` };
  }
}

// ─── checkConflicts ─────────────────────────────────────────────────

export async function checkConflicts(
  input: unknown
): Promise<ApiResult<CheckResult>> {
  try {
    const parsed = CheckConflictsInput.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: `Invalid input: ${parsed.error.issues.map((i) => i.message).join('; ')}`,
      };
    }

    const { openSlotId, facultyId, subjectId } = parsed.data;

    // Fetch open slot
    const { data: openSlot, error: osErr } = await db()
      .from('open_slots')
      .select(`
        id,
        date,
        slot_id,
        end_slot_id,
        class_id,
        room_id,
        time_slots!open_slots_slot_id_fkey(slot_no),
        end_time_slots:time_slots!open_slots_end_slot_id_fkey(slot_no)
      `)
      .eq('id', openSlotId)
      .maybeSingle();

    if (osErr || !openSlot) {
      return { ok: false, error: 'Open slot not found' };
    }

    // Fetch faculty profile
    const { data: facProfile, error: facErr } = await db()
      .from('faculty_profiles')
      .select('id, user_id, max_hours')
      .eq('id', facultyId)
      .maybeSingle();

    if (facErr || !facProfile) {
      return { ok: false, error: 'Faculty profile not found' };
    }

    // Fetch subject
    const { data: subject, error: subErr } = await db()
      .from('subjects')
      .select('id')
      .eq('id', subjectId)
      .maybeSingle();

    if (subErr || !subject) {
      return { ok: false, error: 'Subject not found' };
    }

    const ts = unwrap((openSlot as any).time_slots);
    const ets = unwrap((openSlot as any).end_time_slots);

    // Derive slotNos array for span
    const startSlotNo = ts?.slot_no || 1;
    const endSlotNo = ets?.slot_no || startSlotNo;
    const slotNos = Array.from(
      { length: endSlotNo - startSlotNo + 1 },
      (_, i) => startSlotNo + i
    );

    // Fetch faculty eligible subjects
    const { data: fsData } = await db()
      .from('faculty_subjects')
      .select('subject_id')
      .eq('faculty_id', facultyId);

    const facultySubjectIds = (fsData || []).map((row: any) => row.subject_id);

    // Pre-fetch schedule contexts for faculty, class, and room
    const facultySchedule = await buildScheduleContext(
      'faculty',
      facultyId,
      openSlot.date
    );
    const classSchedule = await buildScheduleContext(
      'class',
      openSlot.class_id,
      openSlot.date
    );
    const roomSchedule = await buildScheduleContext(
      'room',
      openSlot.room_id,
      openSlot.date
    );

    // Pre-fetch current weekly workload
    const currentTotalHours = await getFacultyWeeklyWorkload(
      facultyId,
      openSlot.date
    );

    // Run pure conflict checks engine
    const checkResult = runConflictChecks({
      slotNos,
      facultySchedule,
      classSchedule,
      roomSchedule,
      facultySubjectIds,
      subjectId,
      currentTotalHours,
      maxHours: facProfile.max_hours,
    });

    return { ok: true, data: checkResult };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `checkConflicts failed: ${message}` };
  }
}

// ─── bookSlot ───────────────────────────────────────────────────────

export async function bookSlot(
  input: unknown
): Promise<ApiResult<ExtraLecture>> {
  try {
    const parsed = BookSlotInput.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: `Invalid input: ${parsed.error.issues.map((i) => i.message).join('; ')}`,
      };
    }

    const { openSlotId, facultyId, subjectId } = parsed.data;

    // Fetch open slot to verify status
    const { data: openSlot, error: osErr } = await db()
      .from('open_slots')
      .select('id, date, status, original_faculty_id')
      .eq('id', openSlotId)
      .maybeSingle();

    if (osErr || !openSlot) {
      return { ok: false, error: 'Open slot not found' };
    }

    if (openSlot.status !== 'open') {
      return {
        ok: false,
        error: `Open slot is not open for booking (current status: ${openSlot.status})`,
      };
    }

    // Re-run conflict checks
    const conflictResult = await checkConflicts({
      openSlotId,
      facultyId,
      subjectId,
    });

    if (!conflictResult.ok) {
      return { ok: false, error: conflictResult.error };
    }

    if (!conflictResult.data.ok) {
      const failed = conflictResult.data.checks
        .filter((c) => !c.passed)
        .map((c) => c.detail)
        .join('; ');
      return { ok: false, error: `Conflict checks failed: ${failed}` };
    }

    // Insert extra_lectures row
    const { data: extraLecture, error: elErr } = await db()
      .from('extra_lectures')
      .insert({
        open_slot_id: openSlotId,
        faculty_id: facultyId,
        subject_id: subjectId,
        status: 'confirmed',
      })
      .select()
      .single();

    if (elErr || !extraLecture) {
      return { ok: false, error: `Failed to create extra lecture: ${elErr?.message}` };
    }

    // Update open_slots status to 'booked'
    const { error: osUpdErr } = await db()
      .from('open_slots')
      .update({ status: 'booked' })
      .eq('id', openSlotId);

    if (osUpdErr) {
      return { ok: false, error: `Failed to update open slot status: ${osUpdErr.message}` };
    }

    // Fetch booking faculty user ID and name
    const { data: bookingFac } = await db()
      .from('faculty_profiles')
      .select('user_id, users!inner(name)')
      .eq('id', facultyId)
      .single();

    const bookingFacUser = bookingFac ? unwrap(bookingFac.users) : null;
    const bookingUserName = bookingFacUser?.name || 'Faculty';

    // Fetch original faculty user ID
    const { data: origFac } = await db()
      .from('faculty_profiles')
      .select('user_id')
      .eq('id', openSlot.original_faculty_id)
      .single();

    // Insert notifications
    const notificationsToInsert = [];

    if (bookingFac?.user_id) {
      notificationsToInsert.push({
        user_id: bookingFac.user_id,
        title: 'Extra Lecture Confirmed',
        message: `Your extra lecture booking for ${openSlot.date} was confirmed.`,
        type: 'booking_confirmed',
        related_id: extraLecture.id,
      });
    }

    if (origFac?.user_id) {
      notificationsToInsert.push({
        user_id: origFac.user_id,
        title: 'Open Slot Taken',
        message: `${bookingUserName} has covered your open slot on ${openSlot.date}.`,
        type: 'slot_taken',
        related_id: extraLecture.id,
      });
    }

    if (notificationsToInsert.length > 0) {
      await db().from('notifications').insert(notificationsToInsert);
    }

    return { ok: true, data: extraLecture };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `bookSlot failed: ${message}` };
  }
}
