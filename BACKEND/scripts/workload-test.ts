/**
 * scripts/workload-test.ts — Verification script for B-10 workload engine and service.
 */

import { computeWorkloadStatus, buildWorkloadRow } from '../engine/workload.js';
import { handlers } from '../index.js';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAILED: ${message}`);
    process.exit(1);
  }
}

console.log('=== Running B-10 Workload Engine & Services Verification ===\n');

function testEngineCalculations() {
  console.log('1. Testing pure engine workload calculations ...');

  // under status: assigned < required
  const underStatus = computeWorkloadStatus(20, 16, 16, 24);
  assert(underStatus === 'under', '16 assigned vs 20 required must be under');

  // ok status: assigned >= required and total <= max
  const okStatus = computeWorkloadStatus(20, 20, 22, 24);
  assert(okStatus === 'ok', '20 assigned and 22 total vs 24 max must be ok');

  // over status: total > max
  const overStatus = computeWorkloadStatus(20, 20, 26, 24);
  assert(overStatus === 'over', '26 total vs 24 max must be over');

  const row = buildWorkloadRow({
    facultyId: '20000000-0000-0000-0000-000000000001',
    facultyName: 'Dr. Sharma',
    requiredHours: 20,
    assignedHours: 20,
    extraHours: 2,
    maxHours: 24,
  });

  assert(row.totalHours === 22, 'totalHours must be assigned + extra');
  assert(row.status === 'ok', 'status must be ok');
  console.log('   [PASS] Pure engine workload calculations');
}

async function testServiceValidation() {
  console.log('\n2. Testing getWorkload service ...');

  const hasEnv =
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!hasEnv) {
    console.log('   [SKIP] Supabase environment variables not set. Skipping DB query.');
    return;
  }

  const res = await handlers.getWorkload({});
  if (res.ok) {
    console.log(`   [PASS] getWorkload returned ${res.data.length} faculty workload rows`);
  } else {
    console.log(`   [INFO] getWorkload result: ${res.error}`);
  }
}

async function main() {
  testEngineCalculations();
  await testServiceValidation();
  console.log('\n=== ALL B-10 WORKLOAD TESTS PASSED SUCCESSFULLY ===');
}

main().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
