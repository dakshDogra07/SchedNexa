/**
 * Smoke test for B-01:
 * 1. Call handlers.ping({}) and print the result.
 * 2. Read time_slots from the database and print all 7 rows.
 */
import { handlers } from '../index.js';
import { db } from '../lib/db.js';
import type { TimeSlot } from '../../shared/types.js';

async function main(): Promise<void> {
  // ─── Test 1: ping ─────────────────────────────────────────────────
  console.log('=== ping test ===');
  const pingResult = await handlers.ping({});
  console.log(JSON.stringify(pingResult, null, 2));

  // ─── Test 2: read time_slots ──────────────────────────────────────
  console.log('\n=== time_slots test ===');
  try {
    const supabase = db();
    const { data, error } = await supabase
      .from('time_slots')
      .select('*')
      .order('slot_no', { ascending: true });

    if (error) {
      console.error('DB error:', error.message);
      process.exit(1);
    }

    const slots = data as TimeSlot[];
    console.log(`Rows: ${slots.length}`);
    for (const slot of slots) {
      // Supabase returns time columns as HH:MM:SS; trim to HH:MM
      const start = slot.start_time.substring(0, 5);
      const end = slot.end_time.substring(0, 5);
      console.log(`  slot_no=${slot.slot_no}  ${start}-${end}`);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Could not read time_slots:', message);
    console.error('(If Supabase env vars are not set, this is expected — verification is partial.)');
    process.exit(1);
  }
}

main();
