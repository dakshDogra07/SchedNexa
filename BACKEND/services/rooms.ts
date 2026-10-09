/**
 * services/rooms.ts — Room availability service.
 *
 * Implements:
 *   - getRoomAvailability
 */

import type {
  ApiResult,
  AvailabilityState,
  Room,
  RoomAvailability,
  RoomAvailabilityRow,
  RoomAvailabilitySlot,
  TimeSlot,
} from '@shared/types';
import { isWeekend } from '../lib/dates.js';
import { db } from '../lib/db.js';
import { GetRoomAvailabilityInput } from '../schemas.js';
import { getEffectiveSchedule } from './timetable.js';

export async function getRoomAvailability(
  input: unknown
): Promise<ApiResult<RoomAvailability>> {
  try {
    const parsed = GetRoomAvailabilityInput.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: `Invalid input: ${parsed.error.issues.map((i) => i.message).join('; ')}`,
      };
    }

    const { date } = parsed.data;

    if (isWeekend(date)) {
      return { ok: false, error: 'Date falls on a weekend' };
    }

    // 1. Fetch all rooms and time_slots
    const [{ data: rooms, error: errRooms }, { data: timeSlots, error: errSlots }] =
      await Promise.all([
        db().from('rooms').select('*').order('name'),
        db().from('time_slots').select('*').order('slot_no'),
      ]);

    if (errRooms || errSlots) {
      const errMsg = errRooms?.message || errSlots?.message || 'Database query failed';
      return { ok: false, error: `Database failure: ${errMsg}` };
    }

    if (!rooms || rooms.length === 0) {
      return { ok: true, data: { date, rooms: [] } };
    }

    const sortedSlots = ((timeSlots as TimeSlot[]) || []).sort(
      (a, b) => a.slot_no - b.slot_no
    );

    // 2. Fetch effective schedule entries for this date
    const scheduleRes = await getEffectiveSchedule({ date });
    if (!scheduleRes.ok) {
      return { ok: false, error: scheduleRes.error };
    }

    const scheduleEntries = scheduleRes.data;

    // 3. Build matrix per room
    const roomRows: RoomAvailabilityRow[] = (rooms as Room[]).map((rm) => {
      const roomSchedule = scheduleEntries.filter((e) => e.roomId === rm.id);

      const slots: RoomAvailabilitySlot[] = sortedSlots.map((ts) => {
        // Find matching schedule entry covering this slot_no
        const entry = roomSchedule.find(
          (e) => ts.slot_no >= e.slotNo && ts.slot_no <= e.endSlotNo
        );

        if (!entry) {
          return {
            slotId: ts.id,
            slotNo: ts.slot_no,
            state: 'free' as AvailabilityState,
            who: null,
          };
        }

        if (entry.state === 'open') {
          return {
            slotId: ts.id,
            slotNo: ts.slot_no,
            state: 'open' as AvailabilityState,
            who: `Open Academic Slot (${entry.className})`,
          };
        }

        if (entry.state === 'extra') {
          return {
            slotId: ts.id,
            slotNo: ts.slot_no,
            state: 'busy' as AvailabilityState,
            who: `${entry.className} (${entry.facultyName ?? 'Extra Lecture'})`,
          };
        }

        if (entry.state === 'lab_booking') {
          return {
            slotId: ts.id,
            slotNo: ts.slot_no,
            state: 'busy' as AvailabilityState,
            who: `${entry.facultyName ?? 'Faculty'} (${entry.subjectName ?? 'Lab Booking'})`,
          };
        }

        // State === 'normal'
        return {
          slotId: ts.id,
          slotNo: ts.slot_no,
          state: 'busy' as AvailabilityState,
          who: entry.subjectName ? `${entry.className} (${entry.subjectName})` : entry.className,
        };
      });

      return {
        roomId: rm.id,
        roomName: rm.name,
        roomType: rm.type,
        slots,
      };
    });

    return {
      ok: true,
      data: {
        date,
        rooms: roomRows,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `getRoomAvailability failed: ${message}` };
  }
}
