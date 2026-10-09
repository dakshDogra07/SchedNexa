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
  MoveResult,
  Room,
  ScheduleEntry,
  Subject,
  TimeSlot,
  Timetable,
  TimetableEntry,
} from '@shared/types';
import { generateTimetableGreedy } from '../engine/generator.js';
import { getUTCDayOfWeek, isWeekend } from '../lib/dates.js';
import { db } from '../lib/db.js';
import {
  GenerateTimetableInput,
  GetEffectiveScheduleInput,
  GetTimetableInput,
  MoveTimetableEntryInput,
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

export async function moveTimetableEntry(
  input: unknown
): Promise<ApiResult<MoveResult>> {
  try {
    const parsed = MoveTimetableEntryInput.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: `Invalid input: ${parsed.error.issues.map((i) => i.message).join('; ')}`,
      };
    }

    const { timetableId, day: targetDay, slotId: targetSlotId, roomId: customRoomId } = parsed.data;

    // 1. Fetch target timetable entry
    const { data: entryRow, error: entryErr } = await db()
      .from('timetable')
      .select('*')
      .eq('id', timetableId)
      .single();

    if (entryErr || !entryRow) {
      return { ok: false, error: `Timetable entry with id ${timetableId} not found` };
    }

    const entry = entryRow as Timetable;
    const targetRoomId = customRoomId || entry.room_id;

    // 2. Fetch target time_slots row
    const { data: targetSlotRow, error: slotErr } = await db()
      .from('time_slots')
      .select('*')
      .eq('id', targetSlotId)
      .single();

    if (slotErr || !targetSlotRow) {
      return { ok: false, error: `Time slot with id ${targetSlotId} not found` };
    }

    const targetSlot = targetSlotRow as TimeSlot;

    // 3. Fetch target room row
    const { data: targetRoomRow, error: roomErr } = await db()
      .from('rooms')
      .select('*')
      .eq('id', targetRoomId)
      .single();

    if (roomErr || !targetRoomRow) {
      return { ok: false, error: `Room with id ${targetRoomId} not found` };
    }

    const targetRoom = targetRoomRow as Room;

    // 4. Fetch subject & class details
    const [{ data: subjectRow }, { data: classRow }] = await Promise.all([
      db().from('subjects').select('*').eq('id', entry.subject_id).single(),
      db().from('classes').select('*').eq('id', entry.class_id).single(),
    ]);

    if (!subjectRow || !classRow) {
      return { ok: false, error: 'Subject or Class details not found for timetable entry' };
    }

    const subject = subjectRow as Subject;
    const cls = classRow as Class;

    // Determine if moving a single theory slot or a 2-slot lab block
    let movingRows: Timetable[] = [];
    let targetSlotIds: string[] = [];
    let targetSlotNos: number[] = [];

    if (!entry.block_id) {
      // Theory lecture (1 slot)
      movingRows = [entry];
      targetSlotIds = [targetSlot.id];
      targetSlotNos = [targetSlot.slot_no];
    } else {
      // Lab block (2 consecutive slots)
      const { data: blockRows, error: blockErr } = await db()
        .from('timetable')
        .select('*, time_slots!inner(slot_no)')
        .eq('block_id', entry.block_id);

      if (blockErr || !blockRows || blockRows.length === 0) {
        return { ok: false, error: 'Lab block entries not found' };
      }

      // Sort rows by slot_no ascending
      const sortedBlockRows = (blockRows as any[]).sort(
        (a, b) => a.time_slots.slot_no - b.time_slots.slot_no
      );
      movingRows = sortedBlockRows.map((r) => ({
        id: r.id,
        day: r.day,
        slot_id: r.slot_id,
        class_id: r.class_id,
        subject_id: r.subject_id,
        faculty_id: r.faculty_id,
        room_id: r.room_id,
        block_id: r.block_id,
      }));

      const startSlotNo = targetSlot.slot_no;
      const endSlotNo = startSlotNo + 1;

      // Validate valid lab block pair: (1,2), (2,3), (3,4), (4,5), (6,7)
      const validLabPairs = [
        [1, 2],
        [2, 3],
        [3, 4],
        [4, 5],
        [6, 7],
      ];
      const isValidPair = validLabPairs.some(
        ([s, e]) => s === startSlotNo && e === endSlotNo
      );

      if (!isValidPair) {
        return {
          ok: true,
          data: {
            ok: false,
            conflicts: [
              `Target slot ${startSlotNo} cannot form a valid 2-slot lab block (valid starts: 1, 2, 3, 4, 6)`,
            ],
          },
        };
      }

      // Fetch second time slot
      const { data: secondSlotRow, error: secErr } = await db()
        .from('time_slots')
        .select('*')
        .eq('slot_no', endSlotNo)
        .single();

      if (secErr || !secondSlotRow) {
        return {
          ok: true,
          data: {
            ok: false,
            conflicts: [`Target second slot (slot_no ${endSlotNo}) not found`],
          },
        };
      }

      const secondSlot = secondSlotRow as TimeSlot;
      targetSlotIds = [targetSlot.id, secondSlot.id];
      targetSlotNos = [startSlotNo, endSlotNo];
    }

    const movingRowIds = movingRows.map((r) => r.id);
    const conflicts: string[] = [];

    // 5. Constraint Checks

    // a) Room type check
    if (subject.type === 'lab' && targetRoom.type !== 'lab') {
      conflicts.push('Lab subjects can only be scheduled in lab rooms');
    } else if (subject.type === 'theory' && targetRoom.type !== 'classroom') {
      conflicts.push('Theory subjects can only be scheduled in classrooms');
    }

    // b) Room capacity check
    if (targetRoom.capacity < cls.student_count) {
      conflicts.push(
        `Room capacity (${targetRoom.capacity}) is smaller than class student count (${cls.student_count})`
      );
    }

    // c) Faculty double-booking check (excluding moving rows)
    const { data: facBusy } = await db()
      .from('timetable')
      .select('id, slot_id, time_slots!inner(slot_no)')
      .eq('day', targetDay)
      .eq('faculty_id', entry.faculty_id)
      .in('slot_id', targetSlotIds);

    if (facBusy) {
      const busySlots = facBusy
        .filter((r: any) => !movingRowIds.includes(r.id))
        .map((r: any) => r.time_slots.slot_no);
      if (busySlots.length > 0) {
        conflicts.push(`Faculty is already scheduled at slot(s) ${busySlots.join(', ')} on day ${targetDay}`);
      }
    }

    // d) Class double-booking check (excluding moving rows)
    const { data: classBusy } = await db()
      .from('timetable')
      .select('id, slot_id, time_slots!inner(slot_no)')
      .eq('day', targetDay)
      .eq('class_id', entry.class_id)
      .in('slot_id', targetSlotIds);

    if (classBusy) {
      const busySlots = classBusy
        .filter((r: any) => !movingRowIds.includes(r.id))
        .map((r: any) => r.time_slots.slot_no);
      if (busySlots.length > 0) {
        conflicts.push(`Class is already scheduled at slot(s) ${busySlots.join(', ')} on day ${targetDay}`);
      }
    }

    // e) Room double-booking check (excluding moving rows)
    const { data: roomBusy } = await db()
      .from('timetable')
      .select('id, slot_id, time_slots!inner(slot_no)')
      .eq('day', targetDay)
      .eq('room_id', targetRoomId)
      .in('slot_id', targetSlotIds);

    if (roomBusy) {
      const busySlots = roomBusy
        .filter((r: any) => !movingRowIds.includes(r.id))
        .map((r: any) => r.time_slots.slot_no);
      if (busySlots.length > 0) {
        conflicts.push(`Room is already occupied at slot(s) ${busySlots.join(', ')} on day ${targetDay}`);
      }
    }

    // If any hard constraint fails, return conflicts without saving
    if (conflicts.length > 0) {
      return { ok: true, data: { ok: false, conflicts } };
    }

    // 6. Update database rows
    for (let i = 0; i < movingRows.length; i++) {
      const rowToUpdate = movingRows[i];
      const newSlotId = targetSlotIds[i];

      const { error: updateErr } = await db()
        .from('timetable')
        .update({
          day: targetDay,
          slot_id: newSlotId,
          room_id: targetRoomId,
        })
        .eq('id', rowToUpdate.id);

      if (updateErr) {
        return { ok: false, error: `Failed to update timetable entry: ${updateErr.message}` };
      }
    }

    return { ok: true, data: { ok: true, conflicts: [] } };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `moveTimetableEntry failed: ${message}` };
  }
}

