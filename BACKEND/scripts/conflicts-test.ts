/**
 * scripts/conflicts-test.ts — Unit tests for engine/availability.ts and engine/conflicts.ts
 */

import type { Check } from '@shared/types';
import { emptySchedule, isBusyAt, isBusyForSpan } from '../engine/availability.js';
import { runConflictChecks } from '../engine/conflicts.js';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAILED: ${message}`);
    process.exit(1);
  }
}

console.log('=== Running Availability & Conflict Engine Tests ===\n');

// 1. Availability Tests
console.log('1. Testing availability.ts ...');
const empty = emptySchedule();
assert(!isBusyAt(empty, 1), 'Empty schedule should be free at slot 1');

const normalBusy = {
  ...emptySchedule(),
  timetableSlotNos: [1, 2],
  openSlotNos: [],
};
assert(isBusyAt(normalBusy, 1), 'Slot 1 with normal timetable entry should be busy');
assert(isBusyAt(normalBusy, 2), 'Slot 2 with normal timetable entry should be busy');
assert(!isBusyAt(normalBusy, 3), 'Slot 3 should be free');

const onLeave = {
  ...emptySchedule(),
  timetableSlotNos: [1, 2],
  openSlotNos: [1, 2],
};
assert(!isBusyAt(onLeave, 1), 'Slot 1 on leave (open slot) should be free');
assert(!isBusyAt(onLeave, 2), 'Slot 2 on leave (open slot) should be free');

const extraBusy = {
  ...emptySchedule(),
  extraLectureSlotNos: [3],
};
assert(isBusyAt(extraBusy, 3), 'Slot 3 with extra lecture should be busy');

const labBusy = {
  ...emptySchedule(),
  labBookingSlotNos: [6, 7],
};
assert(isBusyForSpan(labBusy, [6, 7]), 'Span [6, 7] with lab booking should be busy');
assert(!isBusyForSpan(labBusy, [4, 5]), 'Span [4, 5] should be free');

console.log('   Availability tests passed!\n');

// 2. Conflict Checks Tests (5 checks)
console.log('2. Testing conflicts.ts (5 checks) ...');

const defaultInput = {
  slotNos: [1],
  facultySchedule: emptySchedule(),
  classSchedule: emptySchedule(),
  roomSchedule: emptySchedule(),
  facultySubjectIds: ['subj-1', 'subj-2'],
  subjectId: 'subj-1',
  currentTotalHours: 10,
  maxHours: 20,
};

// Test A: All 5 pass
const resAllPass = runConflictChecks(defaultInput);
assert(resAllPass.ok === true, 'All checks should pass');
assert(resAllPass.checks.length === 5, 'Should return exactly 5 checks');
assert(resAllPass.checks.every((c: Check) => c.passed), 'Every check should be passed=true');
console.log('   [PASS] All 5 checks pass scenario');

// Test B: Faculty busy
const resFacultyBusy = runConflictChecks({
  ...defaultInput,
  facultySchedule: { ...emptySchedule(), timetableSlotNos: [1], openSlotNos: [] },
});
assert(resFacultyBusy.ok === false, 'Faculty busy should result in ok=false');
assert(resFacultyBusy.checks.find((c: Check) => c.key === 'faculty_free')?.passed === false, 'faculty_free check should fail');
console.log('   [PASS] Faculty busy check');

// Test C: Subject ineligible
const resSubjectIneligible = runConflictChecks({
  ...defaultInput,
  subjectId: 'subj-999',
});
assert(resSubjectIneligible.ok === false, 'Ineligible subject should result in ok=false');
assert(resSubjectIneligible.checks.find((c: Check) => c.key === 'subject_eligible')?.passed === false, 'subject_eligible check should fail');
console.log('   [PASS] Subject ineligible check');

// Test D: Class busy
const resClassBusy = runConflictChecks({
  ...defaultInput,
  classSchedule: { ...emptySchedule(), extraLectureSlotNos: [1] },
});
assert(resClassBusy.ok === false, 'Class busy should result in ok=false');
assert(resClassBusy.checks.find((c: Check) => c.key === 'class_free')?.passed === false, 'class_free check should fail');
console.log('   [PASS] Class busy check');

// Test E: Room busy
const resRoomBusy = runConflictChecks({
  ...defaultInput,
  roomSchedule: { ...emptySchedule(), labBookingSlotNos: [1] },
});
assert(resRoomBusy.ok === false, 'Room busy should result in ok=false');
assert(resRoomBusy.checks.find((c: Check) => c.key === 'room_reserved')?.passed === false, 'room_reserved check should fail');
console.log('   [PASS] Room busy check');

// Test F: Workload exceeded
const resWorkloadExceeded = runConflictChecks({
  ...defaultInput,
  slotNos: [1, 2], // span = 2
  currentTotalHours: 19,
  maxHours: 20, // 19 + 2 = 21 > 20
});
assert(resWorkloadExceeded.ok === false, 'Exceeded workload should result in ok=false');
assert(resWorkloadExceeded.checks.find((c: Check) => c.key === 'workload_ok')?.passed === false, 'workload_ok check should fail');
console.log('   [PASS] Workload limit check');

// Test G: Span aware lab block (slots 1, 2) where faculty busy on slot 2 only
const resSpanPartialBusy = runConflictChecks({
  ...defaultInput,
  slotNos: [1, 2],
  facultySchedule: { ...emptySchedule(), timetableSlotNos: [2], openSlotNos: [] },
});
assert(resSpanPartialBusy.ok === false, 'Span partial busy should fail');
const facultyCheck = resSpanPartialBusy.checks.find((c: Check) => c.key === 'faculty_free');
assert(facultyCheck !== undefined && facultyCheck.passed === false, 'faculty_free should fail for slot 2');
assert(facultyCheck !== undefined && facultyCheck.detail.includes('2'), 'detail should mention slot 2');
console.log('   [PASS] Span-aware partial busy check');

console.log('\n=== ALL TESTS PASSED SUCCESSFULLY ===');
