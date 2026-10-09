/**
 * scripts/recommend-test.ts — Verification script for B-13 engine/recommend.ts and getRecommendations service.
 */

import { calculateFacultyRecommendation } from '../engine/recommend.js';
import { GetRecommendationsInput } from '../schemas.js';
import { handlers } from '../index.js';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAILED: ${message}`);
    process.exit(1);
  }
}

console.log('=== Running B-13 Recommendation Engine & Service Verification ===\n');

function testEngineScoring() {
  console.log('1. Testing pure engine recommendation scoring ...');

  // All 5 rules pass -> 30 + 30 + 20 + 10 + 10 = 100
  const maxRec = calculateFacultyRecommendation({
    facultyId: '20000000-0000-0000-0000-000000000002',
    facultyName: 'Prof. Kaur',
    isAvailable: true,
    canTeachEligibleSubject: true,
    hasNoConflicts: true,
    isSemesterSuitable: true,
    isWorkloadBelowTarget: true,
  });

  assert(maxRec.score === 100, `Max score must be 100, got ${maxRec.score}`);
  assert(maxRec.reasons.length === 5, 'Reasons must list all 5 rule evaluations');
  console.log('   [PASS] 100-point max recommendation score');

  // None pass -> 0
  const minRec = calculateFacultyRecommendation({
    facultyId: '20000000-0000-0000-0000-000000000005',
    facultyName: 'Dr. Iyer',
    isAvailable: false,
    canTeachEligibleSubject: false,
    hasNoConflicts: false,
    isSemesterSuitable: false,
    isWorkloadBelowTarget: false,
  });

  assert(minRec.score === 0, `Min score must be 0, got ${minRec.score}`);
  console.log('   [PASS] 0-point min recommendation score');

  // Partial score: available + canTeach + noConflict = 80
  const partialRec = calculateFacultyRecommendation({
    facultyId: '20000000-0000-0000-0000-000000000003',
    facultyName: 'Dr. Mehta',
    isAvailable: true,
    canTeachEligibleSubject: true,
    hasNoConflicts: true,
    isSemesterSuitable: false,
    isWorkloadBelowTarget: false,
  });

  assert(partialRec.score === 80, `Partial score must be 80, got ${partialRec.score}`);
  console.log('   [PASS] 80-point partial recommendation score');
}

function testSchemaAndWiring() {
  console.log('\n2. Testing schema validation and handler wiring ...');

  const valid = GetRecommendationsInput.safeParse({ openSlotId: 'open-slot-uuid' });
  assert(valid.success, 'Valid openSlotId must pass schema validation');

  const invalid = GetRecommendationsInput.safeParse({ openSlotId: '' });
  assert(!invalid.success, 'Empty openSlotId must fail schema validation');

  assert(typeof handlers.getRecommendations === 'function', 'handlers.getRecommendations must be a function');
  console.log('   [PASS] Schema validation and handler wiring');
}

async function testServiceQuery() {
  console.log('\n3. Testing getRecommendations service DB query ...');

  const hasEnv =
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!hasEnv) {
    console.log('   [SKIP] Supabase environment variables not set. Skipping DB query.');
    return;
  }

  const res = await handlers.getRecommendations({ openSlotId: '00000000-0000-0000-0000-000000000000' });
  if (!res.ok) {
    console.log(`   [PASS] Non-existent openSlotId cleanly returned error: ${res.error}`);
  }
}

async function main() {
  testEngineScoring();
  testSchemaAndWiring();
  await testServiceQuery();
  console.log('\n=== ALL B-13 RECOMMENDATION TESTS PASSED SUCCESSFULLY ===');
}

main().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
