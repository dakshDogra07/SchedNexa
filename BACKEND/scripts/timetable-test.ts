/**
 * scripts/timetable-test.ts — Verification script for B-05 timetable services.
 */

import { handlers } from '../index.js';
import { getUTCDayOfWeek, isWeekend } from '../lib/dates.js';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAILED: ${message}`);
    process.exit(1);
  }
}

console.log('=== Running B-05 Timetable Services Verification ===\n');

// 1. Date Utility Tests
console.log('1. Testing lib/dates.ts ...');
assert(getUTCDayOfWeek('2026-10-12') === 1, '2026-10-12 should be Monday (1)');
assert(getUTCDayOfWeek('2026-10-16') === 5, '2026-10-16 should be Friday (5)');
assert(getUTCDayOfWeek('2026-10-10') === 6, '2026-10-10 should be Saturday (6)');
assert(getUTCDayOfWeek('2026-10-11') === 7, '2026-10-11 should be Sunday (7)');
assert(isWeekend('2026-10-10') === true, 'Saturday should be weekend');
assert(isWeekend('2026-10-12') === false, 'Monday should not be weekend');
console.log('   Date utility tests passed!\n');

// 2. Input Validation and Error Case Tests
async function testValidationErrors() {
  console.log('2. Testing input validation and error responses ...');

  // getTimetable with multiple filters
  const multiFilterRes = await handlers.getTimetable({
    classId: '40000000-0000-0000-0000-000000000001',
    facultyId: '20000000-0000-0000-0000-000000000001',
  });
  assert(multiFilterRes.ok === false, 'getTimetable with multiple filters must fail');
  assert(
    multiFilterRes.ok === false &&
      multiFilterRes.error.includes('Provide at most one filter'),
    'Error message must state at most one filter'
  );
  console.log('   [PASS] getTimetable multiple filter validation');

  // getEffectiveSchedule on weekend
  const weekendRes = await handlers.getEffectiveSchedule({
    date: '2026-10-10', // Saturday
  });
  assert(weekendRes.ok === false, 'getEffectiveSchedule on weekend must fail');
  assert(
    weekendRes.ok === false && weekendRes.error.includes('weekend'),
    'Error message must state date falls on a weekend'
  );
  console.log('   [PASS] getEffectiveSchedule weekend validation');

  // getEffectiveSchedule with multiple filters
  const multiFilterEffRes = await handlers.getEffectiveSchedule({
    date: '2026-10-12',
    facultyId: '20000000-0000-0000-0000-000000000001',
    classId: '40000000-0000-0000-0000-000000000001',
  });
  assert(multiFilterEffRes.ok === false, 'getEffectiveSchedule with both filters must fail');
  console.log('   [PASS] getEffectiveSchedule multi-filter validation');
}

// 3. DB Integration Tests (if DB env variables configured)
async function testDbIntegration() {
  console.log('\n3. Testing DB integration (if env vars set) ...');

  const hasEnv =
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!hasEnv) {
    console.log(
      '   [SKIP] Supabase environment variables not set. DB query tests skipped.'
    );
    return;
  }

  // Generate timetable and insert into DB
  const genRes = await handlers.generateTimetable({});
  if (genRes.ok) {
    console.log(
      `   [PASS] generateTimetable completed: ${genRes.data.lecturesPlaced} lectures placed, ${genRes.data.conflicts} conflicts`
    );
  } else {
    console.error(`   [FAIL] generateTimetable failed: ${genRes.error}`);
    process.exit(1);
  }

  // Query all timetable entries
  const allTimetableRes = await handlers.getTimetable({});
  if (allTimetableRes.ok) {
    console.log(`   [PASS] getTimetable returned ${allTimetableRes.data.length} entries from database`);
  } else {
    console.error(`   [FAIL] getTimetable failed: ${allTimetableRes.error}`);
    process.exit(1);
  }

  // Query effective schedule for Monday
  const effRes = await handlers.getEffectiveSchedule({ date: '2026-10-12' });
  if (effRes.ok) {
    console.log(`   [PASS] getEffectiveSchedule for 2026-10-12 returned ${effRes.data.length} entries`);
  } else {
    console.error(`   [FAIL] getEffectiveSchedule failed: ${effRes.error}`);
    process.exit(1);
  }
}

async function main() {
  await testValidationErrors();
  await testDbIntegration();
  console.log('\n=== ALL B-05 SERVICE TESTS PASSED SUCCESSFULLY ===');
}

main().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
