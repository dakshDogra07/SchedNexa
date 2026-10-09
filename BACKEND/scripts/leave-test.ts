/**
 * scripts/leave-test.ts — Verification script for B-06 leave services.
 */

import { handlers } from '../index.js';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAILED: ${message}`);
    process.exit(1);
  }
}

console.log('=== Running B-06 Leave Services Verification ===\n');

async function testValidationErrors() {
  console.log('1. Testing input validation & error handling ...');

  // dateFrom > dateTo
  const dateOrderRes = await handlers.getLeaveImpact({
    facultyId: '20000000-0000-0000-0000-000000000001',
    dateFrom: '2026-10-15',
    dateTo: '2026-10-12',
  });
  assert(dateOrderRes.ok === false, 'dateFrom after dateTo must fail');
  assert(
    dateOrderRes.ok === false && dateOrderRes.error.includes('dateFrom cannot be after dateTo'),
    'Error message must state dateFrom cannot be after dateTo'
  );
  console.log('   [PASS] dateFrom after dateTo validation');

  // Weekend-only date range for markLeave
  const weekendRangeRes = await handlers.markLeave({
    facultyId: '20000000-0000-0000-0000-000000000001',
    dateFrom: '2026-10-10', // Saturday
    dateTo: '2026-10-11',   // Sunday
  });
  assert(weekendRangeRes.ok === false, 'Weekend-only date range must fail');
  assert(
    weekendRangeRes.ok === false && weekendRangeRes.error.includes('weekend'),
    'Error message must state date range contains only weekend dates'
  );
  console.log('   [PASS] Weekend-only date range validation');
}

async function testDbIntegration() {
  console.log('\n2. Testing DB integration (if env vars set) ...');

  const hasEnv =
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!hasEnv) {
    console.log(
      '   [SKIP] Supabase environment variables not set. DB query tests skipped.'
    );
    return;
  }

  const facultyId = '20000000-0000-0000-0000-000000000001'; // Dr. Sharma

  // Test getLeaveImpact
  const impactRes = await handlers.getLeaveImpact({
    facultyId,
    dateFrom: '2026-10-12', // Monday
    dateTo: '2026-10-12',
  });

  if (impactRes.ok) {
    console.log(`   [PASS] getLeaveImpact returned ${impactRes.data.length} affected lectures`);
  } else {
    console.error(`   [FAIL] getLeaveImpact failed: ${impactRes.error}`);
    process.exit(1);
  }

  // Test markLeave (or check behavior on existing DB state)
  const leaveRes = await handlers.markLeave({
    facultyId,
    dateFrom: '2026-10-12',
    dateTo: '2026-10-12',
    reason: 'Attending Conference',
  });

  if (leaveRes.ok) {
    console.log(`   [PASS] markLeave created ${leaveRes.data.length} open slots`);
  } else {
    // If leave already exists, verify friendly error
    if (leaveRes.error.includes('Leave request already exists')) {
      console.log(`   [PASS] markLeave idempotency check: ${leaveRes.error}`);
    } else {
      console.error(`   [FAIL] markLeave failed unexpectedly: ${leaveRes.error}`);
      process.exit(1);
    }
  }
}

async function main() {
  await testValidationErrors();
  await testDbIntegration();
  console.log('\n=== ALL B-06 LEAVE SERVICE TESTS PASSED SUCCESSFULLY ===');
}

main().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
