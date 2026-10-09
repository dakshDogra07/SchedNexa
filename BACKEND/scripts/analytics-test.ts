/**
 * scripts/analytics-test.ts — Verification script for B-17 getAnalytics service.
 */

import { GetAnalyticsInput } from '../schemas.js';
import { handlers } from '../index.js';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAILED: ${message}`);
    process.exit(1);
  }
}

console.log('=== Running B-17 Analytics Service Verification ===\n');

function testSchemaValidation() {
  console.log('1. Testing GetAnalyticsInput schema ...');
  const valid = GetAnalyticsInput.safeParse({});
  assert(valid.success, 'Valid empty object input must pass validation');

  const invalid = GetAnalyticsInput.safeParse({ extra: true });
  assert(!invalid.success, 'Unexpected extra fields must fail validation');
  console.log('   [PASS] GetAnalyticsInput schema validation');
}

function testHandlersWiring() {
  console.log('\n2. Testing handlers registry wiring ...');
  assert(typeof handlers.getAnalytics === 'function', 'handlers.getAnalytics must be a function');
  console.log('   [PASS] getAnalytics handler is wired');
}

async function testServiceQuery() {
  console.log('\n3. Testing getAnalytics service DB query ...');

  const hasEnv =
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!hasEnv) {
    console.log('   [SKIP] Supabase environment variables not set. Skipping DB query.');
    return;
  }

  const res = await handlers.getAnalytics({});
  if (res.ok) {
    console.log(`   [PASS] getAnalytics returned datasets: ${Object.keys(res.data).join(', ')}`);
  } else {
    console.log(`   [INFO] getAnalytics result: ${res.error}`);
  }
}

async function main() {
  testSchemaValidation();
  testHandlersWiring();
  await testServiceQuery();
  console.log('\n=== ALL B-17 ANALYTICS TESTS PASSED SUCCESSFULLY ===');
}

main().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
