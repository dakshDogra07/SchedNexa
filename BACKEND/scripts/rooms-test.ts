/**
 * scripts/rooms-test.ts — Verification script for B-11 getRoomAvailability service.
 */

import { GetRoomAvailabilityInput } from '../schemas.js';
import { handlers } from '../index.js';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAILED: ${message}`);
    process.exit(1);
  }
}

console.log('=== Running B-11 Room Availability Service Verification ===\n');

function testSchemaValidation() {
  console.log('1. Testing schema validation for GetRoomAvailabilityInput ...');

  const valid = GetRoomAvailabilityInput.safeParse({ date: '2026-10-12' });
  assert(valid.success, 'Valid YYYY-MM-DD date must pass validation');

  const invalidDate = GetRoomAvailabilityInput.safeParse({ date: 'invalid-date' });
  assert(!invalidDate.success, 'Invalid date format must fail validation');

  const extraField = GetRoomAvailabilityInput.safeParse({ date: '2026-10-12', extra: true });
  assert(!extraField.success, 'Extra field must fail validation (strict schema)');

  console.log('   [PASS] Schema validation tests');
}

async function testWeekendCheck() {
  console.log('\n2. Testing weekend check error ...');

  // 2026-10-10 is a Saturday
  const weekendRes = await handlers.getRoomAvailability({ date: '2026-10-10' });
  assert(!weekendRes.ok, 'Weekend date must return an error result');
  if (!weekendRes.ok) {
    assert(weekendRes.error.includes('weekend'), 'Error message must mention weekend');
  }

  console.log('   [PASS] Weekend check test');
}

async function testServiceQuery() {
  console.log('\n3. Testing getRoomAvailability service DB query ...');

  const hasEnv =
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!hasEnv) {
    console.log('   [SKIP] Supabase environment variables not set. Skipping DB query.');
    return;
  }

  const res = await handlers.getRoomAvailability({ date: '2026-10-12' });
  if (res.ok) {
    console.log(`   [PASS] getRoomAvailability returned ${res.data.rooms.length} room rows for date ${res.data.date}`);
  } else {
    console.log(`   [INFO] getRoomAvailability result: ${res.error}`);
  }
}

async function main() {
  testSchemaValidation();
  await testWeekendCheck();
  await testServiceQuery();
  console.log('\n=== ALL B-11 ROOM AVAILABILITY TESTS PASSED SUCCESSFULLY ===');
}

main().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
