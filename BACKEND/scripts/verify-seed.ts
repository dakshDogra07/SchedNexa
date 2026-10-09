/**
 * B-02 verification script.
 *
 * Pre-requisite: the human has run shared/schema.sql then shared/seed.sql
 * (both MODE 1 and MODE 2) against the Supabase database via the
 * Dashboard SQL Editor or psql.
 *
 * This script queries every table through the Supabase client and checks
 * that row counts match the expected values from seed.sql.
 *
 * Usage:  npx tsx scripts/verify-seed.ts
 */

import { db } from '../lib/db.js';

// Expected counts after running schema.sql + seed.sql (MODE 1 + MODE 2)
const EXPECTED_COUNTS: Record<string, number> = {
  users: 6,               // 1 admin + 5 faculty
  faculty_profiles: 5,    // 5 faculty
  subjects: 12,           // 6 sem-3 + 6 sem-5
  classes: 4,             // CSE-3A, CSE-3B, CSE-5A, CSE-5B
  class_subjects: 24,     // 4 classes × 6 subjects each (semester match)
  faculty_subjects: 14,   // Sharma 3 + Kaur 3 + Mehta 3 + Verma 3 + Iyer 2
  rooms: 6,               // 4 classrooms + 2 labs
  time_slots: 7,          // 7 fixed slots from schema.sql
  timetable: 100,         // MODE 2 demo timetable (100 rows)
  leave_requests: 0,      // cleared in MODE 2
  open_slots: 0,          // cleared in MODE 2
  extra_lectures: 0,      // cleared in MODE 2
  lab_bookings: 0,        // cleared in MODE 2
  notifications: 0,       // cleared in MODE 2
};

async function main(): Promise<void> {
  const supabase = db();
  let allPassed = true;
  let checkedCount = 0;

  console.log('=== B-02: verify seed counts ===\n');

  for (const [table, expected] of Object.entries(EXPECTED_COUNTS)) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.log(`  ✗ ${table}: DB error — ${error.message}`);
      allPassed = false;
      continue;
    }

    const actual = count ?? 0;
    const ok = actual === expected;
    const icon = ok ? '✓' : '✗';
    console.log(`  ${icon} ${table}: ${actual} rows (expected ${expected})`);
    if (!ok) allPassed = false;
    checkedCount++;
  }

  console.log('');
  if (allPassed && checkedCount === Object.keys(EXPECTED_COUNTS).length) {
    console.log('All tables match expected counts. ✓');
  } else {
    console.log('Some checks failed or were skipped. Review output above.');
    process.exit(1);
  }
}

main();
