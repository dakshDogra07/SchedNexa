/**
 * engine/conflicts.ts — PURE conflict checks for extra lecture bookings.
 *
 * No DB calls. Services pre-fetch data and pass a ConflictCheckInput object.
 *
 * The 5 deterministic checks (from API_CONTRACT.md + PROJECT.md):
 *   1. faculty_free      - Faculty is free at slotNos
 *   2. subject_eligible  - subjectId is in faculty_subjects
 *   3. class_free        - Class is free at slotNos
 *   4. room_reserved     - Room is reserved for this slot (free from other bookings)
 *   5. workload_ok       - currentTotalHours + span <= maxHours
 */

import type { Check, CheckResult } from '@shared/types';
import { ScheduleContext, busySlotsInSpan } from './availability.js';

export type ConflictCheckInput = {
  /** The slot numbers covered by the open slot (e.g. [1] for theory, [1, 2] for lab block) */
  slotNos: number[];
  /** Faculty's schedule context for this date */
  facultySchedule: ScheduleContext;
  /** Class's schedule context for this date */
  classSchedule: ScheduleContext;
  /** Room's schedule context for this date */
  roomSchedule: ScheduleContext;
  /** List of subject IDs that the faculty is assigned / eligible to teach */
  facultySubjectIds: string[];
  /** The subject ID requested for the extra lecture */
  subjectId: string;
  /** Faculty's current total hours (assigned + extra) for the week */
  currentTotalHours: number;
  /** Faculty's maximum allowed weekly hours */
  maxHours: number;
};

export function runConflictChecks(input: ConflictCheckInput): CheckResult {
  const {
    slotNos,
    facultySchedule,
    classSchedule,
    roomSchedule,
    facultySubjectIds,
    subjectId,
    currentTotalHours,
    maxHours,
  } = input;

  const span = slotNos.length;
  const slotStr = slotNos.join(', ');

  // 1. faculty_free
  const facultyBusySlots = busySlotsInSpan(facultySchedule, slotNos);
  const facultyFreePassed = facultyBusySlots.length === 0;
  const checkFacultyFree: Check = {
    key: 'faculty_free',
    label: 'Faculty Available',
    passed: facultyFreePassed,
    detail: facultyFreePassed
      ? `Faculty is free at slot(s) ${slotStr}`
      : `Faculty is busy at slot(s) ${facultyBusySlots.join(', ')}`,
  };

  // 2. subject_eligible
  const subjectEligiblePassed = facultySubjectIds.includes(subjectId);
  const checkSubjectEligible: Check = {
    key: 'subject_eligible',
    label: 'Subject Eligibility',
    passed: subjectEligiblePassed,
    detail: subjectEligiblePassed
      ? 'Faculty is eligible to teach this subject'
      : 'Faculty is not qualified/assigned for this subject',
  };

  // 3. class_free
  const classBusySlots = busySlotsInSpan(classSchedule, slotNos);
  const classFreePassed = classBusySlots.length === 0;
  const checkClassFree: Check = {
    key: 'class_free',
    label: 'Class Available',
    passed: classFreePassed,
    detail: classFreePassed
      ? `Class is free at slot(s) ${slotStr}`
      : `Class is busy at slot(s) ${classBusySlots.join(', ')}`,
  };

  // 4. room_reserved
  const roomReservedSlots = busySlotsInSpan(roomSchedule, slotNos);
  const roomReservedPassed = roomReservedSlots.length === 0;
  const checkRoomReserved: Check = {
    key: 'room_reserved',
    label: 'Room Reserved',
    passed: roomReservedPassed,
    detail: roomReservedPassed
      ? `Room is reserved/free for slot(s) ${slotStr}`
      : `Room is busy at slot(s) ${roomReservedSlots.join(', ')}`,
  };

  // 5. workload_ok
  const newTotalHours = currentTotalHours + span;
  const workloadOkPassed = newTotalHours <= maxHours;
  const checkWorkloadOk: Check = {
    key: 'workload_ok',
    label: 'Workload Capacity',
    passed: workloadOkPassed,
    detail: workloadOkPassed
      ? `Workload ${newTotalHours}h / ${maxHours}h max is within limits`
      : `Workload ${newTotalHours}h exceeds max ${maxHours}h limit`,
  };

  const checks: Check[] = [
    checkFacultyFree,
    checkSubjectEligible,
    checkClassFree,
    checkRoomReserved,
    checkWorkloadOk,
  ];

  const ok = checks.every((c) => c.passed);

  return { ok, checks };
}
