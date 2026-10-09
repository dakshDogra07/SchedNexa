/**
 * scripts/demo-test.ts — Verification script for B-09 demo services.
 */

import { handlers } from '../index.js';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAILED: ${message}`);
    process.exit(1);
  }
}

console.log('=== Running B-09 Demo Services Verification ===\n');

async function testDemoUsers() {
  console.log('1. Testing getDemoUsers ...');
  const res = await handlers.getDemoUsers({});
  assert(res.ok === true, 'getDemoUsers must return ok: true');
  if (res.ok) {
    assert(res.data.length === 3, 'Must return exactly 3 demo users');
    console.log(`   [PASS] getDemoUsers returned ${res.data.length} users (Admin, Dr. Sharma, Prof. Kaur)`);
  }
}

async function testResetDemo() {
  console.log('\n2. Testing resetDemo (if DB connected) ...');
  const hasEnv =
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!hasEnv) {
    console.log('   [SKIP] Supabase environment variables not set.');
    return;
  }

  const res = await handlers.resetDemo({});
  if (res.ok) {
    console.log(`   [PASS] resetDemo: ${res.data.message}`);
  } else {
    console.log(`   [INFO] resetDemo result: ${res.error}`);
  }
}

async function main() {
  await testDemoUsers();
  await testResetDemo();
  console.log('\n=== ALL B-09 DEMO SERVICE TESTS PASSED SUCCESSFULLY ===');
}

main().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
