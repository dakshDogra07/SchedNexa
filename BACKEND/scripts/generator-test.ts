/**
 * scripts/generator-test.ts — Unit and integration test for engine/generator.ts
 */

import type {
  Class,
  ClassSubject,
  FacultyProfile,
  FacultySubject,
  Room,
  Subject,
  TimeSlot,
} from '@shared/types';
import { generateTimetableGreedy } from '../engine/generator.js';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAILED: ${message}`);
    process.exit(1);
  }
}

console.log('=== Running Timetable Generator Engine Tests ===\n');

// 1. Prepare Base Seed Data (matching shared/seed.sql)
const timeSlots: TimeSlot[] = [
  { id: 'ts-1', slot_no: 1, start_time: '09:00', end_time: '09:50' },
  { id: 'ts-2', slot_no: 2, start_time: '09:50', end_time: '10:40' },
  { id: 'ts-3', slot_no: 3, start_time: '10:40', end_time: '11:30' },
  { id: 'ts-4', slot_no: 4, start_time: '11:30', end_time: '12:20' },
  { id: 'ts-5', slot_no: 5, start_time: '12:20', end_time: '13:10' },
  { id: 'ts-6', slot_no: 6, start_time: '14:00', end_time: '14:50' },
  { id: 'ts-7', slot_no: 7, start_time: '14:50', end_time: '15:40' },
];

const faculty: FacultyProfile[] = [
  { id: 'fac-1', user_id: 'user-1', department: 'CSE', required_hours: 20, max_hours: 24 }, // Sharma
  { id: 'fac-2', user_id: 'user-2', department: 'CSE', required_hours: 20, max_hours: 24 }, // Kaur
  { id: 'fac-3', user_id: 'user-3', department: 'CSE', required_hours: 20, max_hours: 24 }, // Mehta
  { id: 'fac-4', user_id: 'user-4', department: 'CSE', required_hours: 20, max_hours: 24 }, // Verma
  { id: 'fac-5', user_id: 'user-5', department: 'CSE', required_hours: 20, max_hours: 24 }, // Iyer
];

const subjects: Subject[] = [
  { id: 'subj-1', name: 'DBMS', code: 'CS301', department: 'CSE', semester: 3, type: 'theory', hours_per_week: 4 },
  { id: 'subj-2', name: 'Data Structures', code: 'CS302', department: 'CSE', semester: 3, type: 'theory', hours_per_week: 5 },
  { id: 'subj-3', name: 'Discrete Math', code: 'CS303', department: 'CSE', semester: 3, type: 'theory', hours_per_week: 4 },
  { id: 'subj-4', name: 'Computer Org', code: 'CS304', department: 'CSE', semester: 3, type: 'theory', hours_per_week: 4 },
  { id: 'subj-5', name: 'DBMS Lab', code: 'CS351', department: 'CSE', semester: 3, type: 'lab', hours_per_week: 4 },
  { id: 'subj-6', name: 'Data Structures Lab', code: 'CS352', department: 'CSE', semester: 3, type: 'lab', hours_per_week: 4 },
  { id: 'subj-7', name: 'Operating Systems', code: 'CS501', department: 'CSE', semester: 5, type: 'theory', hours_per_week: 4 },
  { id: 'subj-8', name: 'Computer Networks', code: 'CS502', department: 'CSE', semester: 5, type: 'theory', hours_per_week: 4 },
  { id: 'subj-9', name: 'Software Eng', code: 'CS503', department: 'CSE', semester: 5, type: 'theory', hours_per_week: 4 },
  { id: 'subj-10', name: 'Theory of Computation', code: 'CS504', department: 'CSE', semester: 5, type: 'theory', hours_per_week: 5 },
  { id: 'subj-11', name: 'OS Lab', code: 'CS551', department: 'CSE', semester: 5, type: 'lab', hours_per_week: 4 },
  { id: 'subj-12', name: 'CN Lab', code: 'CS552', department: 'CSE', semester: 5, type: 'lab', hours_per_week: 4 },
];

const classes: Class[] = [
  { id: 'cls-1', name: 'CSE-3A', department: 'CSE', semester: 3, student_count: 55 },
  { id: 'cls-2', name: 'CSE-3B', department: 'CSE', semester: 3, student_count: 52 },
  { id: 'cls-3', name: 'CSE-5A', department: 'CSE', semester: 5, student_count: 50 },
  { id: 'cls-4', name: 'CSE-5B', department: 'CSE', semester: 5, student_count: 48 },
];

const classSubjects: ClassSubject[] = [
  // Semester 3 classes take all Sem 3 subjects
  { class_id: 'cls-1', subject_id: 'subj-1' },
  { class_id: 'cls-1', subject_id: 'subj-2' },
  { class_id: 'cls-1', subject_id: 'subj-3' },
  { class_id: 'cls-1', subject_id: 'subj-4' },
  { class_id: 'cls-1', subject_id: 'subj-5' },
  { class_id: 'cls-1', subject_id: 'subj-6' },

  { class_id: 'cls-2', subject_id: 'subj-1' },
  { class_id: 'cls-2', subject_id: 'subj-2' },
  { class_id: 'cls-2', subject_id: 'subj-3' },
  { class_id: 'cls-2', subject_id: 'subj-4' },
  { class_id: 'cls-2', subject_id: 'subj-5' },
  { class_id: 'cls-2', subject_id: 'subj-6' },

  // Semester 5 classes take all Sem 5 subjects
  { class_id: 'cls-3', subject_id: 'subj-7' },
  { class_id: 'cls-3', subject_id: 'subj-8' },
  { class_id: 'cls-3', subject_id: 'subj-9' },
  { class_id: 'cls-3', subject_id: 'subj-10' },
  { class_id: 'cls-3', subject_id: 'subj-11' },
  { class_id: 'cls-3', subject_id: 'subj-12' },

  { class_id: 'cls-4', subject_id: 'subj-7' },
  { class_id: 'cls-4', subject_id: 'subj-8' },
  { class_id: 'cls-4', subject_id: 'subj-9' },
  { class_id: 'cls-4', subject_id: 'subj-10' },
  { class_id: 'cls-4', subject_id: 'subj-11' },
  { class_id: 'cls-4', subject_id: 'subj-12' },
];

const facultySubjects: FacultySubject[] = [
  // Sharma: DBMS, Discrete Math, DBMS Lab
  { faculty_id: 'fac-1', subject_id: 'subj-1' },
  { faculty_id: 'fac-1', subject_id: 'subj-3' },
  { faculty_id: 'fac-1', subject_id: 'subj-5' },
  // Kaur: OS, SE, OS Lab
  { faculty_id: 'fac-2', subject_id: 'subj-7' },
  { faculty_id: 'fac-2', subject_id: 'subj-9' },
  { faculty_id: 'fac-2', subject_id: 'subj-11' },
  // Mehta: Discrete Math, CO, DS Lab
  { faculty_id: 'fac-3', subject_id: 'subj-3' },
  { faculty_id: 'fac-3', subject_id: 'subj-4' },
  { faculty_id: 'fac-3', subject_id: 'subj-6' },
  // Verma: CN, SE, CN Lab
  { faculty_id: 'fac-4', subject_id: 'subj-8' },
  { faculty_id: 'fac-4', subject_id: 'subj-9' },
  { faculty_id: 'fac-4', subject_id: 'subj-12' },
  // Iyer: DS, TOC
  { faculty_id: 'fac-5', subject_id: 'subj-2' },
  { faculty_id: 'fac-5', subject_id: 'subj-10' },
];

const rooms: Room[] = [
  { id: 'room-1', name: 'Room 101', capacity: 60, type: 'classroom', equipment: [] },
  { id: 'room-2', name: 'Room 102', capacity: 60, type: 'classroom', equipment: [] },
  { id: 'room-3', name: 'Room 103', capacity: 60, type: 'classroom', equipment: [] },
  { id: 'room-4', name: 'Room 104', capacity: 60, type: 'classroom', equipment: [] },
  { id: 'room-5', name: 'Lab 1', capacity: 60, type: 'lab', equipment: ['PCs', 'Projector'] },
  { id: 'room-6', name: 'Lab 2', capacity: 60, type: 'lab', equipment: ['PCs', 'Switches'] },
];

// 2. Execute Generator
console.log('Generating timetable from seed data...');
const { timetable, result } = generateTimetableGreedy({
  classes,
  subjects,
  classSubjects,
  faculty,
  facultySubjects,
  rooms,
  timeSlots,
});

console.log(`- Lectures Placed: ${result.lecturesPlaced}`);
console.log(`- Conflicts Reported: ${result.conflicts}`);
console.log(`- Unscheduled Count: ${result.unscheduled.length}`);
console.log(`- Faculty at Full Load: ${result.facultyAtFullLoad}`);

// 3. Verifications
assert(result.conflicts === 0, 'Generator result.conflicts must be 0');
assert(result.unscheduled.length === 0, 'All seed lectures should be successfully scheduled');
assert(timetable.length > 0, 'Timetable must contain placed lectures');

// Verify No Double Booking in Generated Timetable
const facultySlotSet = new Set<string>();
const classSlotSet = new Set<string>();
const roomSlotSet = new Set<string>();

const roomMap = new Map<string, Room>(rooms.map((r) => [r.id, r]));
const subjectMap = new Map<string, Subject>(subjects.map((s) => [s.id, s]));
const slotMap = new Map<string, TimeSlot>(timeSlots.map((ts) => [ts.id, ts]));

for (const row of timetable) {
  const facKey = `${row.day}_${row.slot_id}_${row.faculty_id}`;
  const clsKey = `${row.day}_${row.slot_id}_${row.class_id}`;
  const rmKey = `${row.day}_${row.slot_id}_${row.room_id}`;

  assert(!facultySlotSet.has(facKey), `Faculty double booking detected at day ${row.day}, slot ${row.slot_id}`);
  assert(!classSlotSet.has(clsKey), `Class double booking detected at day ${row.day}, slot ${row.slot_id}`);
  assert(!roomSlotSet.has(rmKey), `Room double booking detected at day ${row.day}, slot ${row.slot_id}`);

  facultySlotSet.add(facKey);
  classSlotSet.add(clsKey);
  roomSlotSet.add(rmKey);

  // Room type vs Subject type matching
  const roomObj = roomMap.get(row.room_id);
  const subjObj = subjectMap.get(row.subject_id);

  assert(roomObj !== undefined && subjObj !== undefined, 'Room and Subject must exist in map');
  if (roomObj && subjObj) {
    const isCompatibleRoom =
      (subjObj.type === 'lab' && roomObj.type === 'lab') ||
      (subjObj.type === 'theory' && roomObj.type === 'classroom');
    assert(
      isCompatibleRoom,
      `Subject type ${subjObj.type} placed in incompatible room type ${roomObj.type}`
    );
  }
}

// Verify Lab Blocks consistency
const blockMap = new Map<string, typeof timetable>();
for (const row of timetable) {
  if (row.block_id) {
    const list = blockMap.get(row.block_id) || [];
    list.push(row);
    blockMap.set(row.block_id, list);
  }
}

for (const [blockId, rows] of blockMap.entries()) {
  assert(rows.length === 2, `Lab block ${blockId} must contain exactly 2 rows`);
  const [row1, row2] = rows;
  assert(row1.day === row2.day, `Lab block ${blockId} rows must be on the same day`);
  assert(row1.class_id === row2.class_id, `Lab block ${blockId} rows must share class`);
  assert(row1.faculty_id === row2.faculty_id, `Lab block ${blockId} rows must share faculty`);
  assert(row1.room_id === row2.room_id, `Lab block ${blockId} rows must share room`);

  const sNo1 = slotMap.get(row1.slot_id)?.slot_no;
  const sNo2 = slotMap.get(row2.slot_id)?.slot_no;
  assert(sNo1 !== undefined && sNo2 !== undefined, 'Slot numbers must exist');
  if (sNo1 !== undefined && sNo2 !== undefined) {
    const slotDiff = Math.abs(sNo1 - sNo2);
    assert(slotDiff === 1, `Lab block ${blockId} slots must be consecutive (got slot ${sNo1} and ${sNo2})`);
  }
}

console.log('\n=== ALL GENERATOR TESTS PASSED SUCCESSFULLY ===');
