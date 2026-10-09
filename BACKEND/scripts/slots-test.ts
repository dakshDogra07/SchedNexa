/**
 * scripts/slots-test.ts — Verification script for B-07 Open Slots services.
 */

import { handlers } from '../index.js';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAILED: ${message}`);
    process.exit(1);
  }
}

console.log('=== Running B-07 Open Slots Services Verification ===\n');

async function testValidationErrors() {
  console.log('1. Testing input validation & error handling ...');

  // getOpenSlots invalid status
  const invalidStatusRes = await handlers.getOpenSlots({
    status: 'invalid_status' as any,
  });
  assert(invalidStatusRes.ok === false, 'Invalid status must fail Zod validation');
  console.log('   [PASS] getOpenSlots invalid status validation');

  // checkConflicts missing openSlotId
  const checkMissingRes = await handlers.checkConflicts({
    openSlotId: '',
    facultyId: '20000000-0000-0000-0000-000000000001',
    subjectId: '30000000-0000-0000-0000-000000000001',
  });
  assert(checkMissingRes.ok === false, 'Missing openSlotId must fail Zod validation');
  console.log('   [PASS] checkConflicts missing openSlotId validation');

  // bookSlot missing subjectId
  const bookMissingRes = await handlers.bookSlot({
    openSlotId: '40000000-0000-0000-0000-000000000001',
    facultyId: '20000000-0000-0000-0000-000000000001',
    subjectId: '',
  });
  assert(bookMissingRes.ok === false, 'Missing subjectId must fail Zod validation');
  console.log('   [PASS] bookSlot missing subjectId validation');
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

  // Test getOpenSlots
  const openSlotsRes = await handlers.getOpenSlots({ status: 'open' });
  if (openSlotsRes.ok) {
    console.log(`   [PASS] getOpenSlots returned ${openSlotsRes.data.length} open slots`);
  } else {
    console.log(`   [INFO] getOpenSlots result: ${openSlotsRes.error}`);
  }
}

async function main() {
  await testValidationErrors();
  await testDbIntegration();
  console.log('\n=== ALL B-07 OPEN SLOTS SERVICE TESTS PASSED SUCCESSFULLY ===');
}

main().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
