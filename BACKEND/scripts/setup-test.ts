/**
 * scripts/setup-test.ts — Verification script for B-12 setup list/upsert functions.
 */

import {
  UpsertFacultyInputSchema,
  UpsertSubjectInputSchema,
  UpsertClassInputSchema,
  UpsertRoomInputSchema,
} from '../schemas.js';
import { handlers } from '../index.js';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAILED: ${message}`);
    process.exit(1);
  }
}

console.log('=== Running B-12 Setup Services Verification ===\n');

function testSchemaValidation() {
  console.log('1. Testing UpsertFacultyInputSchema ...');
  const validFaculty = UpsertFacultyInputSchema.safeParse({
    user_id: '10000000-0000-0000-0000-000000000002',
    department: 'CSE',
    required_hours: 20,
    max_hours: 24,
  });
  assert(validFaculty.success, 'Valid faculty upsert must pass');

  const invalidFacultyHours = UpsertFacultyInputSchema.safeParse({
    user_id: '10000000-0000-0000-0000-000000000002',
    required_hours: 25,
    max_hours: 20,
  });
  assert(!invalidFacultyHours.success, 'Faculty max_hours < required_hours must fail');
  console.log('   [PASS] Faculty schema validation');

  console.log('\n2. Testing UpsertSubjectInputSchema ...');
  const validTheory = UpsertSubjectInputSchema.safeParse({
    name: 'DBMS',
    code: 'CS301',
    department: 'CSE',
    semester: 3,
    type: 'theory',
    hours_per_week: 5,
  });
  assert(validTheory.success, 'Theory subject with odd hours must pass');

  const validLab = UpsertSubjectInputSchema.safeParse({
    name: 'DBMS Lab',
    code: 'CS351',
    department: 'CSE',
    semester: 3,
    type: 'lab',
    hours_per_week: 4,
  });
  assert(validLab.success, 'Lab subject with even hours must pass');

  const invalidLabHours = UpsertSubjectInputSchema.safeParse({
    name: 'DBMS Lab',
    code: 'CS351',
    department: 'CSE',
    semester: 3,
    type: 'lab',
    hours_per_week: 3,
  });
  assert(!invalidLabHours.success, 'Lab subject with odd hours must fail');
  console.log('   [PASS] Subject schema validation');

  console.log('\n3. Testing UpsertClassInputSchema ...');
  const validClass = UpsertClassInputSchema.safeParse({
    name: 'CSE-3A',
    department: 'CSE',
    semester: 3,
    student_count: 55,
  });
  assert(validClass.success, 'Valid class upsert must pass');

  const invalidClassCount = UpsertClassInputSchema.safeParse({
    name: 'CSE-3A',
    semester: 3,
    student_count: 0,
  });
  assert(!invalidClassCount.success, 'Class with student_count 0 must fail');
  console.log('   [PASS] Class schema validation');

  console.log('\n4. Testing UpsertRoomInputSchema ...');
  const validClassroom = UpsertRoomInputSchema.safeParse({
    name: 'Room 101',
    capacity: 60,
    type: 'classroom',
    equipment: [],
  });
  assert(validClassroom.success, 'Classroom with empty equipment must pass');

  const invalidClassroomEquipment = UpsertRoomInputSchema.safeParse({
    name: 'Room 101',
    capacity: 60,
    type: 'classroom',
    equipment: ['Projector'],
  });
  assert(!invalidClassroomEquipment.success, 'Classroom with equipment must fail');

  const validLabRoom = UpsertRoomInputSchema.safeParse({
    name: 'Lab 1',
    capacity: 30,
    type: 'lab',
    equipment: ['Desktop PCs', 'Projector'],
  });
  assert(validLabRoom.success, 'Lab with equipment must pass');
  console.log('   [PASS] Room schema validation');
}

function testHandlersWiring() {
  console.log('\n5. Testing handlers registry wiring for setup functions ...');
  assert(typeof handlers.listFaculty === 'function', 'handlers.listFaculty must be a function');
  assert(typeof handlers.listSubjects === 'function', 'handlers.listSubjects must be a function');
  assert(typeof handlers.listClasses === 'function', 'handlers.listClasses must be a function');
  assert(typeof handlers.listRooms === 'function', 'handlers.listRooms must be a function');
  assert(typeof handlers.upsertFaculty === 'function', 'handlers.upsertFaculty must be a function');
  assert(typeof handlers.upsertSubject === 'function', 'handlers.upsertSubject must be a function');
  assert(typeof handlers.upsertClass === 'function', 'handlers.upsertClass must be a function');
  assert(typeof handlers.upsertRoom === 'function', 'handlers.upsertRoom must be a function');
  console.log('   [PASS] All setup handlers wired');
}

async function main() {
  testSchemaValidation();
  testHandlersWiring();
  console.log('\n=== ALL B-12 SETUP TESTS PASSED SUCCESSFULLY ===');
}

main().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
