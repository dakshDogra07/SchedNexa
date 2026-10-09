/**
 * services/leave.ts — Leave request and Open Academic Slot services.
 *
 * Implements:
 *   - getLeaveImpact
 *   - markLeave
 */

import type {
  AffectedLecture,
  ApiResult,
  OpenSlot,
} from '@shared/types';
import { getUTCDayOfWeek, isWeekend } from '../lib/dates.js';
import { db } from '../lib/db.js';
import { GetLeaveImpactInput, MarkLeaveInput } from '../schemas.js';

function getDateRange(dateFromStr: string, dateToStr: string): string[] {
  const dates: string[] = [];
  const curr = new Date(dateFromStr + 'T00:00:00Z');
  const end = new Date(dateToStr + 'T00:00:00Z');

  while (curr <= end) {
    dates.push(curr.toISOString().slice(0, 10));
    curr.setUTCDate(curr.getUTCDate() + 1);
  }
  return dates;
}

type GroupedLecture = {
  timetableId: string;
  day: number;
  slotId: string;
  endSlotId: string;
  slotNo: number;
  endSlotNo: number;
  startTime: string;
  endTime: string;
  span: number;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  roomId: string;
  roomName: string;
};

async function getGroupedLecturesForFacultyAndDay(
  facultyId: string,
  day: number
): Promise<GroupedLecture[]> {
  const { data, error } = await db()
    .from('timetable')
    .select(`
      id,
      day,
      slot_id,
      class_id,
      subject_id,
      faculty_id,
      room_id,
      block_id,
      time_slots!inner(slot_no, start_time, end_time),
      classes!inner(name),
      subjects!inner(name),
      rooms!inner(name)
    `)
    .eq('faculty_id', facultyId)
    .eq('day', day);

  if (error || !data) return [];

  const singleRows: any[] = [];
  const blockGroups = new Map<string, any[]>();

  for (const row of data) {
    if (row.block_id) {
      const list = blockGroups.get(row.block_id) || [];
      list.push(row);
      blockGroups.set(row.block_id, list);
    } else {
      singleRows.push(row);
    }
  }

  const grouped: GroupedLecture[] = [];

  // Single theory lectures
  for (const r of singleRows) {
    grouped.push({
      timetableId: r.id,
      day: r.day,
      slotId: r.slot_id,
      endSlotId: r.slot_id,
      slotNo: r.time_slots.slot_no,
      endSlotNo: r.time_slots.slot_no,
      startTime: r.time_slots.start_time,
      endTime: r.time_slots.end_time,
      span: 1,
      classId: r.class_id,
      className: r.classes.name,
      subjectId: r.subject_id,
      subjectName: r.subjects.name,
      roomId: r.room_id,
      roomName: r.rooms.name,
    });
  }

  // Lab blocks (2 consecutive slots)
  for (const [, rows] of blockGroups.entries()) {
    rows.sort((a, b) => a.time_slots.slot_no - b.time_slots.slot_no);
    const r1 = rows[0];
    const r2 = rows[rows.length - 1];

    grouped.push({
      timetableId: r1.id, // FIRST row of lab block
      day: r1.day,
      slotId: r1.slot_id,
      endSlotId: r2.slot_id,
      slotNo: r1.time_slots.slot_no,
      endSlotNo: r2.time_slots.slot_no,
      startTime: r1.time_slots.start_time,
      endTime: r2.time_slots.end_time,
      span: rows.length,
      classId: r1.class_id,
      className: r1.classes.name,
      subjectId: r1.subject_id,
      subjectName: r1.subjects.name,
      roomId: r1.room_id,
      roomName: r1.rooms.name,
    });
  }

  grouped.sort((a, b) => a.slotNo - b.slotNo);
  return grouped;
}

export async function getLeaveImpact(
  input: unknown
): Promise<ApiResult<AffectedLecture[]>> {
  try {
    const parsed = GetLeaveImpactInput.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: `Invalid input: ${parsed.error.issues.map((i) => i.message).join('; ')}`,
      };
    }

    const { facultyId, dateFrom, dateTo } = parsed.data;

    if (dateFrom > dateTo) {
      return { ok: false, error: 'dateFrom cannot be after dateTo' };
    }

    // Verify faculty exists
    const { data: fac, error: facErr } = await db()
      .from('faculty_profiles')
      .select('id')
      .eq('id', facultyId)
      .single();

    if (facErr || !fac) {
      return { ok: false, error: 'Faculty profile not found' };
    }

    const dates = getDateRange(dateFrom, dateTo);
    const affectedLectures: AffectedLecture[] = [];

    for (const date of dates) {
      if (isWeekend(date)) continue;

      const day = getUTCDayOfWeek(date);
      const dayLectures = await getGroupedLecturesForFacultyAndDay(facultyId, day);

      for (const lec of dayLectures) {
        affectedLectures.push({
          timetableId: lec.timetableId,
          date,
          day: lec.day,
          slotId: lec.slotId,
          endSlotId: lec.endSlotId,
          slotNo: lec.slotNo,
          endSlotNo: lec.endSlotNo,
          startTime: lec.startTime,
          endTime: lec.endTime,
          span: lec.span,
          classId: lec.classId,
          className: lec.className,
          subjectId: lec.subjectId,
          subjectName: lec.subjectName,
          roomId: lec.roomId,
          roomName: lec.roomName,
        });
      }
    }

    return { ok: true, data: affectedLectures };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `getLeaveImpact failed: ${message}` };
  }
}

export async function markLeave(
  input: unknown
): Promise<ApiResult<OpenSlot[]>> {
  try {
    const parsed = MarkLeaveInput.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: `Invalid input: ${parsed.error.issues.map((i) => i.message).join('; ')}`,
      };
    }

    const { facultyId, dateFrom, dateTo, reason } = parsed.data;

    if (dateFrom > dateTo) {
      return { ok: false, error: 'dateFrom cannot be after dateTo' };
    }

    // Verify faculty exists
    const { data: fac, error: facErr } = await db()
      .from('faculty_profiles')
      .select('id')
      .eq('id', facultyId)
      .single();

    if (facErr || !fac) {
      return { ok: false, error: 'Faculty profile not found' };
    }

    const allDates = getDateRange(dateFrom, dateTo);
    const workingDates = allDates.filter((d) => !isWeekend(d));

    if (workingDates.length === 0) {
      return { ok: false, error: 'Date range contains only weekend dates' };
    }

    // Check for existing leave requests
    const { data: existingLeaves, error: existErr } = await db()
      .from('leave_requests')
      .select('date')
      .eq('faculty_id', facultyId)
      .in('date', workingDates);

    if (existErr) {
      return { ok: false, error: `Database failure checking leave: ${existErr.message}` };
    }

    if (existingLeaves && existingLeaves.length > 0) {
      return {
        ok: false,
        error: `Leave request already exists for date ${existingLeaves[0].date}`,
      };
    }

    const createdOpenSlots: OpenSlot[] = [];

    for (const date of workingDates) {
      // 1. Create leave_requests row
      const { data: leaveReq, error: leaveErr } = await db()
        .from('leave_requests')
        .insert({
          faculty_id: facultyId,
          date,
          reason: reason || null,
          status: 'approved',
        })
        .select()
        .single();

      if (leaveErr || !leaveReq) {
        return {
          ok: false,
          error: `Failed to create leave request for ${date}: ${leaveErr?.message}`,
        };
      }

      // 2. Fetch timetable lectures for this weekday
      const day = getUTCDayOfWeek(date);
      const dayLectures = await getGroupedLecturesForFacultyAndDay(facultyId, day);

      for (const lec of dayLectures) {
        // 3. Create open_slots row
        const { data: openSlot, error: osErr } = await db()
          .from('open_slots')
          .insert({
            leave_request_id: leaveReq.id,
            timetable_id: lec.timetableId,
            date,
            slot_id: lec.slotId,
            end_slot_id: lec.endSlotId,
            class_id: lec.classId,
            room_id: lec.roomId,
            original_faculty_id: facultyId,
            status: 'open',
          })
          .select()
          .single();

        if (osErr || !openSlot) {
          return {
            ok: false,
            error: `Failed to create open slot for lecture: ${osErr?.message}`,
          };
        }

        createdOpenSlots.push(openSlot as OpenSlot);

        // 4. Notify eligible faculty (who teach subjectId, excluding facultyId on leave)
        const { data: eligibleFacSubjs } = await db()
          .from('faculty_subjects')
          .select('faculty_id, faculty_profiles!inner(user_id)')
          .eq('subject_id', lec.subjectId)
          .neq('faculty_id', facultyId);

        if (eligibleFacSubjs && eligibleFacSubjs.length > 0) {
          const notificationsToInsert = eligibleFacSubjs.map((ef: any) => ({
            user_id: ef.faculty_profiles.user_id,
            title: 'Open Academic Slot Available',
            message: `Open slot created for ${lec.className} (${lec.subjectName}) on ${date} (Slots ${lec.slotNo}-${lec.endSlotNo})`,
            type: 'open_slot',
            related_id: openSlot.id,
            read: false,
          }));

          await db().from('notifications').insert(notificationsToInsert);
        }
      }
    }

    return { ok: true, data: createdOpenSlots };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `markLeave failed: ${message}` };
  }
}
