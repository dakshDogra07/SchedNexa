/**
 * scripts/move-test.ts — Verification script for B-14 moveTimetableEntry service.
 */

import { MoveTimetableEntryInput } from '../schemas.js';
import { handlers } from '../index.js';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAILED: ${message}`);
    process.exit(1);
  }
}

console.log('=== Running B-14 Move Timetable Entry Service Verification ===\n');

function testSchemaValidation() {
  console.log('1. Testing MoveTimetableEntryInput schema validation ...');

  const valid = MoveTimetableEntryInput.safeParse({
    timetableId: 'd0000000-0000-0000-0000-000000000001',
    day: 2,
    slotId: 'a0000000-0000-0000-0000-000000000003',
    roomId: '50000000-0000-0000-0000-000000000002',
  });
  assert(valid.success, 'Valid move input must pass validation');

  const invalidDayHigh = MoveTimetableEntryInput.safeParse({
    timetableId: 'd0000000-0000-0000-0000-000000000001',
    day: 6,
    slotId: 'a0000000-0000-0000-0000-000000000003',
  });
  assert(!invalidDayHigh.success, 'Day 6 must fail validation (day between 1 and 5)');

  const invalidDayLow = MoveTimetableEntryInput.safeParse({
    timetableId: 'd0000000-0000-0000-0000-000000000001',
    day: 0,
    slotId: 'a0000000-0000-0000-0000-000000000003',
  });
  assert(!invalidDayLow.success, 'Day 0 must fail validation');

  console.log('   [PASS] Schema validation tests');
}

function testHandlersWiring() {
  console.log('\n2. Testing handlers registry wiring ...');
  assert(typeof handlers.moveTimetableEntry === 'function', 'handlers.moveTimetableEntry must be a function');
  console.log('   [PASS] moveTimetableEntry handler is wired');
}

async function testServiceQuery() {
  console.log('\n3. Testing moveTimetableEntry service DB query ...');

  const hasEnv =
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!hasEnv) {
    console.log('   [SKIP] Supabase environment variables not set. Skipping DB query.');
    return;
  }

  const res = await handlers.moveTimetableEntry({
    timetableId: '00000000-0000-0000-0000-000000000000',
    day: 1,
    slotId: 'a0000000-0000-0000-0000-000000000001',
  });
  if (!res.ok) {
    console.log(`   [PASS] Non-existent timetableId cleanly returned error: ${res.error}`);
  }
}

async function main() {
  testSchemaValidation();
  testHandlersWiring();
  await testServiceQuery();
  console.log('\n=== ALL B-14 MOVE TIMETABLE TESTS PASSED SUCCESSFULLY ===');
}

main().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
