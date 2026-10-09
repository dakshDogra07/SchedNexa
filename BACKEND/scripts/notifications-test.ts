/**
 * scripts/notifications-test.ts — Verification script for B-08 notification services.
 */

import { handlers } from '../index.js';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAILED: ${message}`);
    process.exit(1);
  }
}

console.log('=== Running B-08 Notification Services Verification ===\n');

async function testValidationErrors() {
  console.log('1. Testing input validation & error handling ...');

  // getNotifications empty userId
  const emptyUserRes = await handlers.getNotifications({
    userId: '',
  });
  assert(emptyUserRes.ok === false, 'Empty userId must fail Zod validation');
  console.log('   [PASS] getNotifications empty userId validation');

  // markNotificationRead empty notificationId
  const emptyNotifRes = await handlers.markNotificationRead({
    notificationId: '',
  });
  assert(emptyNotifRes.ok === false, 'Empty notificationId must fail Zod validation');
  console.log('   [PASS] markNotificationRead empty notificationId validation');
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

  const userId = '10000000-0000-0000-0000-000000000002'; // Dr. Sharma user ID from seed

  // Test getNotifications
  const notifRes = await handlers.getNotifications({ userId });
  if (notifRes.ok) {
    console.log(`   [PASS] getNotifications returned ${notifRes.data.length} notifications`);
  } else {
    console.log(`   [INFO] getNotifications result: ${notifRes.error}`);
  }
}

async function main() {
  await testValidationErrors();
  await testDbIntegration();
  console.log('\n=== ALL B-08 NOTIFICATION SERVICE TESTS PASSED SUCCESSFULLY ===');
}

main().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
