/**
 * engine/availability.ts — PURE schedule availability checks.
 *
 * No DB calls. Services pre-fetch data and build a ScheduleContext,
 * then call these functions to determine if an entity (faculty, class,
 * or room) is busy at a given slot.
 *
 * Availability logic (from PROJECT.md):
 * An entity is BUSY at (date, slotNo) if:
 *   - it has a timetable row at weekday(date)+slotNo with NO open_slot
 *     for that date (an open_slot means the entity is freed); OR
 *   - it has a confirmed extra_lecture at that slot; OR
 *   - it has an approved lab_booking at that slot.
 */

// ─── Types ──────────────────────────────────────────────────────────

/**
 * Pre-fetched schedule data for a single entity on a single date.
 * Services build this from DB queries; the engine never touches the DB.
 */
export type ScheduleContext = {
  /** Slot numbers where the entity has a timetable entry on this weekday. */
  timetableSlotNos: number[];
  /**
   * Slot numbers where those timetable entries have an open_slot on
   * this date (entity is freed from normal duty at these slots).
   */
  openSlotNos: number[];
  /** Slot numbers where the entity has a confirmed extra lecture on this date. */
  extraLectureSlotNos: number[];
  /** Slot numbers where the entity has an approved lab booking on this date. */
  labBookingSlotNos: number[];
};

// ─── Functions ──────────────────────────────────────────────────────

/**
 * Returns true if the entity is busy at the given slot number.
 *
 * Busy means:
 *   1. Has a timetable entry AND that entry does NOT have an open_slot
 *      for this date (normal lecture in progress); OR
 *   2. Has a confirmed extra_lecture at this slot; OR
 *   3. Has an approved lab_booking at this slot.
 */
export function isBusyAt(ctx: ScheduleContext, slotNo: number): boolean {
  // Normal timetable entry with no open_slot → busy
  const hasTimetable = ctx.timetableSlotNos.includes(slotNo);
  const hasOpenSlot = ctx.openSlotNos.includes(slotNo);
  if (hasTimetable && !hasOpenSlot) {
    return true;
  }

  // Confirmed extra lecture → busy
  if (ctx.extraLectureSlotNos.includes(slotNo)) {
    return true;
  }

  // Approved lab booking → busy
  if (ctx.labBookingSlotNos.includes(slotNo)) {
    return true;
  }

  return false;
}

/**
 * Returns true if the entity is busy at ANY of the given slot numbers.
 * Used for span-aware checks (lab blocks cover 2 slots).
 */
export function isBusyForSpan(ctx: ScheduleContext, slotNos: number[]): boolean {
  return slotNos.some((slotNo) => isBusyAt(ctx, slotNo));
}

/**
 * Returns the subset of slotNos where the entity is busy.
 * Useful for building human-readable error details.
 */
export function busySlotsInSpan(ctx: ScheduleContext, slotNos: number[]): number[] {
  return slotNos.filter((slotNo) => isBusyAt(ctx, slotNo));
}

/**
 * Creates an empty ScheduleContext (entity has nothing scheduled).
 * Convenience for tests and edge cases.
 */
export function emptySchedule(): ScheduleContext {
  return {
    timetableSlotNos: [],
    openSlotNos: [],
    extraLectureSlotNos: [],
    labBookingSlotNos: [],
  };
}
