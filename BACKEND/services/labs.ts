/**
 * services/labs.ts — Lab booking services.
 *
 * Implements:
 *   - createLabBooking
 *   - listLabBookings
 *   - decideLabBooking
 */

import type { ApiResult, LabBooking, Room, TimeSlot } from '@shared/types';
import { getUTCDayOfWeek, isWeekend } from '../lib/dates.js';
import { db } from '../lib/db.js';
import {
  CreateLabBookingInput,
  DecideLabBookingInput,
  ListLabBookingsInput,
} from '../schemas.js';

function unwrap<T>(val: T | T[] | null | undefined): T | null {
  if (!val) return null;
  return Array.isArray(val) ? val[0] || null : val;
}

/**
 * Checks if an entity (faculty or room) is free on a given date across the specified slot numbers.
 */
async function checkEntityAvailability(
  entityType: 'faculty' | 'room',
  entityId: string,
  dateStr: string,
  slotNos: number[],
  excludeBookingId?: string
): Promise<{ free: boolean; reason?: string }> {
  const day = getUTCDayOfWeek(dateStr);
  const idCol = `${entityType}_id`;

  // 1. Timetable entries on weekday without open slot
  const { data: ttData } = await db()
    .from('timetable')
    .select('id, slot_id, time_slots!inner(slot_no)')
    .eq(idCol, entityId)
    .eq('day', day);

  const ttSlotNos = (ttData || [])
    .map((row: any) => unwrap(row.time_slots)?.slot_no)
    .filter((s): s is number => typeof s === 'number');

  // Check if those timetable entries have an open_slot on this date (which frees the entity)
  const { data: osData } = await db()
    .from('open_slots')
    .select('slot_id, end_slot_id, time_slots!open_slots_slot_id_fkey(slot_no), end_time_slots:time_slots!open_slots_end_slot_id_fkey(slot_no)')
    .eq(idCol, entityId)
    .eq('date', dateStr)
    .neq('status', 'cancelled');

  const openSlotNos = new Set<number>();
  (osData || []).forEach((row: any) => {
    const sNo = unwrap(row.time_slots)?.slot_no;
    const eNo = unwrap(row.end_time_slots)?.slot_no || sNo;
    if (sNo && eNo) {
      for (let s = sNo; s <= eNo; s++) openSlotNos.add(s);
    }
  });

  const busyTtSlots = ttSlotNos.filter((s) => slotNos.includes(s) && !openSlotNos.has(s));
  if (busyTtSlots.length > 0) {
    return {
      free: false,
      reason: `${entityType === 'faculty' ? 'Faculty' : 'Lab room'} has a scheduled lecture at slot(s) ${busyTtSlots.join(', ')}`,
    };
  }

  // 2. Extra lectures on date
  const { data: elData } = await db()
    .from('extra_lectures')
    .select('open_slots!inner(date, slot_id, end_slot_id, time_slots!open_slots_slot_id_fkey(slot_no), end_time_slots:time_slots!open_slots_end_slot_id_fkey(slot_no))')
    .eq(entityType === 'faculty' ? 'faculty_id' : 'open_slots.room_id', entityId)
    .eq('status', 'confirmed');

  const extraSlotNos: number[] = [];
  (elData || []).forEach((row: any) => {
    const os = unwrap(row.open_slots);
    if (os && os.date === dateStr) {
      const sNo = unwrap(os.time_slots)?.slot_no;
      const eNo = unwrap(os.end_time_slots)?.slot_no || sNo;
      if (sNo && eNo) {
        for (let s = sNo; s <= eNo; s++) extraSlotNos.push(s);
      }
    }
  });

  const busyElSlots = extraSlotNos.filter((s) => slotNos.includes(s));
  if (busyElSlots.length > 0) {
    return {
      free: false,
      reason: `${entityType === 'faculty' ? 'Faculty' : 'Lab room'} has an extra lecture at slot(s) ${busyElSlots.join(', ')}`,
    };
  }

  // 3. Approved lab bookings on date
  let lbQuery = db()
    .from('lab_bookings')
    .select('id, slot_id, end_slot_id, time_slots!lab_bookings_slot_id_fkey(slot_no), end_time_slots:time_slots!lab_bookings_end_slot_id_fkey(slot_no)')
    .eq(idCol, entityId)
    .eq('date', dateStr)
    .eq('status', 'approved');

  if (excludeBookingId) {
    lbQuery = lbQuery.neq('id', excludeBookingId);
  }

  const { data: lbData } = await lbQuery;
  const labBookingSlotNos: number[] = [];
  (lbData || []).forEach((row: any) => {
    const sNo = unwrap(row.time_slots)?.slot_no;
    const eNo = unwrap(row.end_time_slots)?.slot_no || sNo;
    if (sNo && eNo) {
      for (let s = sNo; s <= eNo; s++) labBookingSlotNos.push(s);
    }
  });

  const busyLbSlots = labBookingSlotNos.filter((s) => slotNos.includes(s));
  if (busyLbSlots.length > 0) {
    return {
      free: false,
      reason: `${entityType === 'faculty' ? 'Faculty' : 'Lab room'} has an approved lab booking at slot(s) ${busyLbSlots.join(', ')}`,
    };
  }

  return { free: true };
}

// ─── createLabBooking ───────────────────────────────────────────────

export async function createLabBooking(
  input: unknown
): Promise<ApiResult<LabBooking>> {
  try {
    const parsed = CreateLabBookingInput.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: `Invalid input: ${parsed.error.issues.map((i) => i.message).join('; ')}`,
      };
    }

    const { roomId, facultyId, date, slotId, purpose, equipment } = parsed.data;

    if (isWeekend(date)) {
      return { ok: false, error: 'Date falls on a weekend' };
    }

    // Fetch room
    const { data: roomRow, error: roomErr } = await db()
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (roomErr || !roomRow) {
      return { ok: false, error: `Room with id ${roomId} not found` };
    }

    const room = roomRow as Room;
    if (room.type !== 'lab') {
      return { ok: false, error: 'Room is not of type lab' };
    }

    // Equipment subset check
    for (const reqEq of equipment) {
      if (!room.equipment.includes(reqEq)) {
        return {
          ok: false,
          error: `Equipment "${reqEq}" is not available in room ${room.name}`,
        };
      }
    }

    // Fetch start slot
    const { data: slotRow, error: slotErr } = await db()
      .from('time_slots')
      .select('*')
      .eq('id', slotId)
      .single();

    if (slotErr || !slotRow) {
      return { ok: false, error: `Time slot with id ${slotId} not found` };
    }

    const startSlot = slotRow as TimeSlot;
    const startSlotNo = startSlot.slot_no;
    const endSlotNo = startSlotNo + 1;

    // Validate valid 2-slot lab block pair: (1,2), (2,3), (3,4), (4,5), (6,7)
    const validPairs = [
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [6, 7],
    ];
    const isValidPair = validPairs.some(([s, e]) => s === startSlotNo && e === endSlotNo);
    if (!isValidPair) {
      return {
        ok: false,
        error: `Slot ${startSlotNo} cannot start a valid 2-slot lab block (valid starts: 1, 2, 3, 4, 6)`,
      };
    }

    // Fetch end slot
    const { data: endSlotRow, error: endSlotErr } = await db()
      .from('time_slots')
      .select('*')
      .eq('slot_no', endSlotNo)
      .single();

    if (endSlotErr || !endSlotRow) {
      return { ok: false, error: `Second time slot for slot_no ${endSlotNo} not found` };
    }

    const endSlot = endSlotRow as TimeSlot;
    const slotNos = [startSlotNo, endSlotNo];

    // Check availability for lab and faculty
    const facAvail = await checkEntityAvailability('faculty', facultyId, date, slotNos);
    const roomAvail = await checkEntityAvailability('room', roomId, date, slotNos);

    let status: 'approved' | 'rejected' = 'approved';
    let rejectionReason: string | undefined;

    if (!facAvail.free) {
      status = 'rejected';
      rejectionReason = facAvail.reason;
    } else if (!roomAvail.free) {
      status = 'rejected';
      rejectionReason = roomAvail.reason;
    }

    // Insert lab_bookings row
    const { data: inserted, error: insertErr } = await db()
      .from('lab_bookings')
      .insert({
        room_id: roomId,
        faculty_id: facultyId,
        date,
        slot_id: startSlot.id,
        end_slot_id: endSlot.id,
        purpose,
        equipment,
        status,
      })
      .select()
      .single();

    if (insertErr || !inserted) {
      return { ok: false, error: `Database failure inserting lab booking: ${insertErr?.message}` };
    }

    const booking = inserted as LabBooking;

    // Fetch faculty user_id for notification
    const { data: facProfile } = await db()
      .from('faculty_profiles')
      .select('user_id')
      .eq('id', facultyId)
      .single();

    if (facProfile) {
      await db().from('notifications').insert({
        user_id: facProfile.user_id,
        title: status === 'approved' ? 'Lab Booking Approved' : 'Lab Booking Rejected',
        message: status === 'approved'
          ? `Your lab booking for ${room.name} on ${date} (Slots ${startSlotNo}-${endSlotNo}) was auto-approved.`
          : `Your lab booking for ${room.name} on ${date} was rejected: ${rejectionReason}`,
        type: 'lab_booking',
        related_id: booking.id,
      });
    }

    return { ok: true, data: booking };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `createLabBooking failed: ${message}` };
  }
}

// ─── listLabBookings ────────────────────────────────────────────────

export async function listLabBookings(
  input: unknown
): Promise<ApiResult<LabBooking[]>> {
  try {
    const parsed = ListLabBookingsInput.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: `Invalid input: ${parsed.error.issues.map((i) => i.message).join('; ')}`,
      };
    }

    const { facultyId } = parsed.data;

    let query = db().from('lab_bookings').select('*').order('date', { ascending: false });

    if (facultyId) {
      query = query.eq('faculty_id', facultyId);
    }

    const { data, error } = await query;

    if (error) {
      return { ok: false, error: `Database failure: ${error.message}` };
    }

    return { ok: true, data: (data as LabBooking[]) || [] };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `listLabBookings failed: ${message}` };
  }
}

// ─── decideLabBooking ───────────────────────────────────────────────

export async function decideLabBooking(
  input: unknown
): Promise<ApiResult<LabBooking>> {
  try {
    const parsed = DecideLabBookingInput.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: `Invalid input: ${parsed.error.issues.map((i) => i.message).join('; ')}`,
      };
    }

    const { bookingId, status: newStatus } = parsed.data;

    // Fetch existing booking
    const { data: bookingRow, error: fetchErr } = await db()
      .from('lab_bookings')
      .select('*, time_slots!lab_bookings_slot_id_fkey(slot_no), end_time_slots:time_slots!lab_bookings_end_slot_id_fkey(slot_no)')
      .eq('id', bookingId)
      .single();

    if (fetchErr || !bookingRow) {
      return { ok: false, error: `Lab booking with id ${bookingId} not found` };
    }

    const booking = bookingRow as any;
    const startSlotNo = unwrap(booking.time_slots)?.slot_no || 1;
    const endSlotNo = unwrap(booking.end_time_slots)?.slot_no || startSlotNo + 1;
    const slotNos = [startSlotNo, endSlotNo];

    // If approving, re-check availability
    if (newStatus === 'approved') {
      const facAvail = await checkEntityAvailability('faculty', booking.faculty_id, booking.date, slotNos, bookingId);
      const roomAvail = await checkEntityAvailability('room', booking.room_id, booking.date, slotNos, bookingId);

      if (!facAvail.free) {
        return { ok: false, error: `Cannot approve booking: ${facAvail.reason}` };
      }
      if (!roomAvail.free) {
        return { ok: false, error: `Cannot approve booking: ${roomAvail.reason}` };
      }
    }

    // Update status
    const { data: updated, error: updateErr } = await db()
      .from('lab_bookings')
      .update({ status: newStatus })
      .eq('id', bookingId)
      .select()
      .single();

    if (updateErr || !updated) {
      return { ok: false, error: `Failed to update lab booking: ${updateErr?.message}` };
    }

    const updatedBooking = updated as LabBooking;

    // Notify faculty
    const { data: facProfile } = await db()
      .from('faculty_profiles')
      .select('user_id')
      .eq('id', booking.faculty_id)
      .single();

    if (facProfile) {
      await db().from('notifications').insert({
        user_id: facProfile.user_id,
        title: `Lab Booking ${newStatus.toUpperCase()}`,
        message: `Your lab booking request on ${booking.date} has been ${newStatus}.`,
        type: 'lab_booking',
        related_id: bookingId,
      });
    }

    return { ok: true, data: updatedBooking };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `decideLabBooking failed: ${message}` };
  }
}
