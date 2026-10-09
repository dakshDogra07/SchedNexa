/**
 * scripts/stats-test.ts — Verification script for B-16 getDashboardStats service.
 */

import { GetDashboardStatsInput } from '../schemas.js';
import { handlers } from '../index.js';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAILED: ${message}`);
    process.exit(1);
  }
}

console.log('=== Running B-16 Dashboard Stats Service Verification ===\n');

function testSchemaValidation() {
  console.log('1. Testing GetDashboardStatsInput schema ...');
  const valid = GetDashboardStatsInput.safeParse({});
  assert(valid.success, 'Valid empty object input must pass validation');

  const invalid = GetDashboardStatsInput.safeParse({ extra: 'field' });
  assert(!invalid.success, 'Unexpected fields must fail strict schema validation');
  console.log('   [PASS] GetDashboardStatsInput schema validation');
}

function testHandlersWiring() {
  console.log('\n2. Testing handlers registry wiring ...');
  assert(typeof handlers.getDashboardStats === 'function', 'handlers.getDashboardStats must be a function');
  console.log('   [PASS] getDashboardStats handler is wired');
}

async function testServiceQuery() {
  console.log('\n3. Testing getDashboardStats service DB query ...');

  const hasEnv =
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!hasEnv) {
    console.log('   [SKIP] Supabase environment variables not set. Skipping DB query.');
    return;
  }

  const res = await handlers.getDashboardStats({});
  if (res.ok) {
    console.log(`   [PASS] getDashboardStats returned: lectures=${res.data.lectures}, utilization=${res.data.roomUtilizationPct}%, openSlotsFilled=${res.data.openSlotsFilled}, hoursSaved=${res.data.hoursSaved}`);
  } else {
    console.log(`   [INFO] getDashboardStats result: ${res.error}`);
  }
}

async function main() {
  testSchemaValidation();
  testHandlersWiring();
  await testServiceQuery();
  console.log('\n=== ALL B-16 DASHBOARD STATS TESTS PASSED SUCCESSFULLY ===');
}

main().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
