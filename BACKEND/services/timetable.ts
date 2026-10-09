/**
 * services/timetable.ts — Timetable services orchestrating DB queries and generator.
 *
 * Implements:
 *   - generateTimetable
 *   - getTimetable
 *   - getEffectiveSchedule
 */

import type {
  ApiResult,
  Class,
  ClassSubject,
  FacultyProfile,
  FacultySubject,
  GenerationResult,
  Room,
  ScheduleEntry,
  Subject,
  TimeSlot,
  TimetableEntry,
} from '@shared/types';
import { generateTimetableGreedy } from '../engine/generator.js';
import { getUTCDayOfWeek, isWeekend } from '../lib/dates.js';
import { db } from '../lib/db.js';
import {
  GenerateTimetableInput,
  GetEffectiveScheduleInput,
  GetTimetableInput,
} from '../schemas.js';

export async function generateTimetable(
  input: unknown
): Promise<ApiResult<GenerationResult>> {
  try {
    const parsed = GenerateTimetableInput.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: `Invalid input: ${parsed.error.issues.map((i) => i.message).join('; ')}`,
      };
    }

    // Fetch base data
    const [
      { data: classes, error: errClasses },
      { data: subjects, error: errSubjects },
      { data: classSubjects, error: errClassSubj },
      { data: faculty, error: errFaculty },
      { data: facultySubjects, error: errFacSubj },
      { data: rooms, error: errRooms },
      { data: timeSlots, error: errSlots },
    ] = await Promise.all([
      db().from('classes').select('*'),
      db().from('subjects').select('*'),
      db().from('class_subjects').select('*'),
      db().from('faculty_profiles').select('*'),
      db().from('faculty_subjects').select('*'),
      db().from('rooms').select('*'),
      db().from('time_slots').select('*'),
    ]);

    if (
      errClasses ||
      errSubjects ||
      errClassSubj ||
      errFaculty ||
      errFacSubj ||
      errRooms ||
      errSlots
    ) {
      const errMsg =
        errClasses?.message ||
        errSubjects?.message ||
        errClassSubj?.message ||
        errFaculty?.message ||
        errFacSubj?.message ||
        errRooms?.message ||
        errSlots?.message ||
        'Database query failed while fetching base data';
      return { ok: false, error: `Database failure: ${errMsg}` };
    }

    // Run greedy generator engine
    const { timetable: generatedRows, result } = generateTimetableGreedy({
      classes: classes as Class[],
      subjects: subjects as Subject[],
      classSubjects: classSubjects as ClassSubject[],
      faculty: faculty as FacultyProfile[],
      facultySubjects: facultySubjects as FacultySubject[],
      rooms: rooms as Room[],
      timeSlots: timeSlots as TimeSlot[],
    });

    // Replace timetable table rows in database
    const { error: deleteErr } = await db()
      .from('timetable')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (deleteErr) {
      return { ok: false, error: `Failed to clear timetable: ${deleteErr.message}` };
    }

    if (generatedRows.length > 0) {
      // Chunk inserts in batches of 50
      const batchSize = 50;
      for (let i = 0; i < generatedRows.length; i += batchSize) {
        const batch = generatedRows.slice(i, i + batchSize);
        const { error: insertErr } = await db().from('timetable').insert(batch);
        if (insertErr) {
          return {
            ok: false,
            error: `Failed to insert generated timetable rows: ${insertErr.message}`,
          };
        }
      }
    }

    return { ok: true, data: result };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `generateTimetable failed: ${message}` };
  }
}

export async function getTimetable(
  input: unknown
): Promise<ApiResult<TimetableEntry[]>> {
  try {
    const parsed = GetTimetableInput.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: `Invalid input: ${parsed.error.issues.map((i) => i.message).join('; ')}`,
      };
    }

    const { classId, facultyId, roomId } = parsed.data;

    // Filter check: at most one filter allowed
    const filtersProvided = [classId, facultyId, roomId].filter(Boolean).length;
    if (filtersProvided > 1) {
      return {
        ok: false,
        error: 'Provide at most one filter: classId, facultyId, or roomId',
      };
    }

    let query = db().from('timetable').select(`
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
        subjects!inner(name, type),
        faculty_profiles!inner(users!inner(name)),
        rooms!inner(name)
      `);

    if (classId) {
      query = query.eq('class_id', classId);
    } else if (facultyId) {
      query = query.eq('faculty_id', facultyId);
    } else if (roomId) {
      query = query.eq('room_id', roomId);
    }

    const { data, error } = await query;
    if (error) {
      return { ok: false, error: `Database failure: ${error.message}` };
    }

    if (!data) {
      return { ok: true, data: [] };
    }

    // Map joined Supabase output to TimetableEntry[]
    const entries: TimetableEntry[] = data.map((row: any) => ({
      id: row.id,
      day: row.day,
      slotId: row.slot_id,
      slotNo: row.time_slots.slot_no,
      startTime: row.time_slots.start_time,
      endTime: row.time_slots.end_time,
      classId: row.class_id,
      className: row.classes.name,
      subjectId: row.subject_id,
      subjectName: row.subjects.name,
      subjectType: row.subjects.type,
      facultyId: row.faculty_id,
      facultyName: row.faculty_profiles.users.name,
      roomId: row.room_id,
      roomName: row.rooms.name,
      blockId: row.block_id,
    }));

    // Sort by day then slotNo
    entries.sort((a, b) => a.day - b.day || a.slotNo - b.slotNo);

    return { ok: true, data: entries };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `getTimetable failed: ${message}` };
  }
}

export async function getEffectiveSchedule(
  input: unknown
): Promise<ApiResult<ScheduleEntry[]>> {
  try {
    const parsed = GetEffectiveScheduleInput.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: `Invalid input: ${parsed.error.issues.map((i) => i.message).join('; ')}`,
      };
    }

    const { date, facultyId, classId } = parsed.data;

    if (facultyId && classId) {
      return {
        ok: false,
        error: 'Provide at most one filter: date with facultyId OR classId',
      };
    }

    if (isWeekend(date)) {
      return { ok: false, error: 'Date falls on a weekend' };
    }

    const day = getUTCDayOfWeek(date);

    // 1. Fetch template timetable entries for this weekday
    const timetableResult = await getTimetable({ facultyId, classId });
    if (!timetableResult.ok) {
      return { ok: false, error: timetableResult.error };
    }

    const templateEntries = timetableResult.data.filter((e) => e.day === day);

    // 2. Fetch open_slots for this date
    let openSlotsQuery = db()
      .from('open_slots')
      .select('*')
      .eq('date', date);

    if (classId) {
      openSlotsQuery = openSlotsQuery.eq('class_id', classId);
    } else if (facultyId) {
      openSlotsQuery = openSlotsQuery.eq('original_faculty_id', facultyId);
    }

    const { data: openSlotsData, error: openSlotsErr } = await openSlotsQuery;
    if (openSlotsErr) {
      return { ok: false, error: `Database failure fetching open_slots: ${openSlotsErr.message}` };
    }

    const openSlots = openSlotsData || [];

    // Map open_slots by timetable_id
    const openSlotsByTimetableId = new Map<string, any>();
    for (const os of openSlots) {
      openSlotsByTimetableId.set(os.timetable_id, os);
    }

    // 3. Fetch extra_lectures for booked open slots
    const bookedOpenSlotIds = openSlots
      .filter((os: any) => os.status === 'booked')
      .map((os: any) => os.id);

    let extraLecturesMap = new Map<string, any>();
    if (bookedOpenSlotIds.length > 0) {
      const { data: extraLecturesData, error: extraErr } = await db()
        .from('extra_lectures')
        .select(`
          id,
          open_slot_id,
          faculty_id,
          subject_id,
          status,
          subjects!inner(name),
          faculty_profiles!inner(users!inner(name))
        `)
        .in('open_slot_id', bookedOpenSlotIds)
        .eq('status', 'confirmed');

      if (extraErr) {
        return { ok: false, error: `Database failure fetching extra_lectures: ${extraErr.message}` };
      }

      if (extraLecturesData) {
        for (const el of extraLecturesData) {
          extraLecturesMap.set(el.open_slot_id, el);
        }
      }
    }

    // 4. Fetch approved lab_bookings for this date
    let labBookingsQuery = db()
      .from('lab_bookings')
      .select(`
        id,
        room_id,
        faculty_id,
        date,
        slot_id,
        end_slot_id,
        purpose,
        status,
        rooms!inner(name),
        faculty_profiles!inner(users!inner(name)),
        slot1:time_slots!lab_bookings_slot_id_fkey(slot_no, start_time),
        slot2:time_slots!lab_bookings_end_slot_id_fkey(slot_no, end_time)
      `)
      .eq('date', date)
      .eq('status', 'approved');

    if (facultyId) {
      labBookingsQuery = labBookingsQuery.eq('faculty_id', facultyId);
    }

    const { data: labBookingsData, error: labErr } = await labBookingsQuery;
    if (labErr) {
      return { ok: false, error: `Database failure fetching lab_bookings: ${labErr.message}` };
    }

    // Map template entries to ScheduleEntry overlay
    const schedule: ScheduleEntry[] = [];

    // Helper to calculate end slot details from template or span
    for (const t of templateEntries) {
      const openSlot = openSlotsByTimetableId.get(t.id);

      if (!openSlot) {
        // Normal template lecture
        schedule.push({
          date,
          day,
          slotId: t.slotId,
          slotNo: t.slotNo,
          endSlotId: t.slotId,
          endSlotNo: t.slotNo,
          startTime: t.startTime,
          endTime: t.endTime,
          span: 1,
          state: 'normal',
          classId: t.classId,
          className: t.className,
          roomId: t.roomId,
          roomName: t.roomName,
          subjectId: t.subjectId,
          subjectName: t.subjectName,
          facultyId: t.facultyId,
          facultyName: t.facultyName,
          timetableId: t.id,
          openSlotId: null,
          extraLectureId: null,
          labBookingId: null,
          blockId: t.blockId,
        });
      } else if (openSlot.status === 'open') {
        // Open Academic Slot
        schedule.push({
          date,
          day,
          slotId: t.slotId,
          slotNo: t.slotNo,
          endSlotId: openSlot.end_slot_id || t.slotId,
          endSlotNo: t.slotNo,
          startTime: t.startTime,
          endTime: t.endTime,
          span: 1,
          state: 'open',
          classId: t.classId,
          className: t.className,
          roomId: t.roomId,
          roomName: t.roomName,
          subjectId: null,
          subjectName: null,
          facultyId: null,
          facultyName: null,
          timetableId: t.id,
          openSlotId: openSlot.id,
          extraLectureId: null,
          labBookingId: null,
          blockId: t.blockId,
        });
      } else if (openSlot.status === 'booked') {
        // Extra Lecture booked by another faculty
        const extra = extraLecturesMap.get(openSlot.id);
        schedule.push({
          date,
          day,
          slotId: t.slotId,
          slotNo: t.slotNo,
          endSlotId: openSlot.end_slot_id || t.slotId,
          endSlotNo: t.slotNo,
          startTime: t.startTime,
          endTime: t.endTime,
          span: 1,
          state: 'extra',
          classId: t.classId,
          className: t.className,
          roomId: t.roomId,
          roomName: t.roomName,
          subjectId: extra ? extra.subject_id : t.subjectId,
          subjectName: extra ? (extra.subjects as any).name : t.subjectName,
          facultyId: extra ? extra.faculty_id : t.facultyId,
          facultyName: extra ? (extra.faculty_profiles as any).users.name : t.facultyName,
          timetableId: t.id,
          openSlotId: openSlot.id,
          extraLectureId: extra ? extra.id : null,
          labBookingId: null,
          blockId: t.blockId,
        });
      }
    }

    // Add approved lab bookings as ScheduleEntry items
    if (labBookingsData) {
      for (const lb of labBookingsData as any[]) {
        schedule.push({
          date,
          day,
          slotId: lb.slot_id,
          slotNo: lb.slot1.slot_no,
          endSlotId: lb.end_slot_id,
          endSlotNo: lb.slot2.slot_no,
          startTime: lb.slot1.start_time,
          endTime: lb.slot2.end_time,
          span: lb.slot2.slot_no - lb.slot1.slot_no + 1,
          state: 'lab_booking',
          classId: '',
          className: 'Lab Booking',
          roomId: lb.room_id,
          roomName: lb.rooms.name,
          subjectId: null,
          subjectName: lb.purpose,
          facultyId: lb.faculty_id,
          facultyName: lb.faculty_profiles.users.name,
          timetableId: null,
          openSlotId: null,
          extraLectureId: null,
          labBookingId: lb.id,
          blockId: null,
        });
      }
    }

    // Sort by slotNo
    schedule.sort((a, b) => a.slotNo - b.slotNo);

    return { ok: true, data: schedule };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `getEffectiveSchedule failed: ${message}` };
  }
}
