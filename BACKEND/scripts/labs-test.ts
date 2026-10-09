/**
 * scripts/labs-test.ts — Verification script for B-15 lab booking services.
 */

import {
  CreateLabBookingInput,
  ListLabBookingsInput,
  DecideLabBookingInput,
} from '../schemas.js';
import { handlers } from '../index.js';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAILED: ${message}`);
    process.exit(1);
  }
}

console.log('=== Running B-15 Lab Booking Services Verification ===\n');

function testSchemaValidation() {
  console.log('1. Testing CreateLabBookingInput schema ...');
  const validCreate = CreateLabBookingInput.safeParse({
    roomId: '50000000-0000-0000-0000-000000000005',
    facultyId: '20000000-0000-0000-0000-000000000001',
    date: '2026-10-12',
    slotId: 'a0000000-0000-0000-0000-000000000001',
    purpose: 'DBMS Hands-on Lab Session',
    equipment: ['Desktop PCs', 'Projector'],
  });
  assert(validCreate.success, 'Valid lab booking create input must pass validation');

  const invalidDate = CreateLabBookingInput.safeParse({
    roomId: '50000000-0000-0000-0000-000000000005',
    facultyId: '20000000-0000-0000-0000-000000000001',
    date: 'invalid-date',
    slotId: 'a0000000-0000-0000-0000-000000000001',
    purpose: 'DBMS Hands-on Lab Session',
    equipment: [],
  });
  assert(!invalidDate.success, 'Invalid date format must fail validation');
  console.log('   [PASS] CreateLabBookingInput schema validation');

  console.log('\n2. Testing ListLabBookingsInput schema ...');
  const validList = ListLabBookingsInput.safeParse({ facultyId: '20000000-0000-0000-0000-000000000001' });
  assert(validList.success, 'Valid list lab bookings input must pass');
  console.log('   [PASS] ListLabBookingsInput schema validation');

  console.log('\n3. Testing DecideLabBookingInput schema ...');
  const validDecide = DecideLabBookingInput.safeParse({
    bookingId: 'booking-uuid',
    status: 'approved',
  });
  assert(validDecide.success, 'Valid decide lab booking input must pass');
  console.log('   [PASS] DecideLabBookingInput schema validation');
}

function testHandlersWiring() {
  console.log('\n4. Testing handlers registry wiring ...');
  assert(typeof handlers.createLabBooking === 'function', 'handlers.createLabBooking must be a function');
  assert(typeof handlers.listLabBookings === 'function', 'handlers.listLabBookings must be a function');
  assert(typeof handlers.decideLabBooking === 'function', 'handlers.decideLabBooking must be a function');
  console.log('   [PASS] All lab booking handlers wired');
}

async function main() {
  testSchemaValidation();
  testHandlersWiring();
  console.log('\n=== ALL B-15 LAB BOOKING TESTS PASSED SUCCESSFULLY ===');
}

main().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
