/**
 * services/recommend.ts — Recommendation service for ranking faculty to fill an Open Academic Slot.
 *
 * Implements:
 *   - getRecommendations
 */

import type { ApiResult, Recommendation } from '@shared/types';
import { calculateFacultyRecommendation } from '../engine/recommend.js';
import { db } from '../lib/db.js';
import { GetRecommendationsInput } from '../schemas.js';
import { checkConflicts } from './slots.js';

function unwrap<T>(val: T | T[] | null | undefined): T | null {
  if (!val) return null;
  return Array.isArray(val) ? val[0] || null : val;
}

export async function getRecommendations(
  input: unknown
): Promise<ApiResult<Recommendation[]>> {
  try {
    const parsed = GetRecommendationsInput.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: `Invalid input: ${parsed.error.issues.map((i) => i.message).join('; ')}`,
      };
    }

    const { openSlotId } = parsed.data;

    // 1. Fetch Open Slot details from DB
    const { data: openSlotRow, error: slotErr } = await db()
      .from('open_slots')
      .select(`
        id,
        leave_request_id,
        timetable_id,
        date,
        slot_id,
        end_slot_id,
        class_id,
        room_id,
        original_faculty_id,
        status,
        classes!inner(id, name, department, semester),
        rooms!inner(id, name, type),
        time_slots!open_slots_slot_id_fkey(slot_no),
        end_time_slots:time_slots!open_slots_end_slot_id_fkey(slot_no)
      `)
      .eq('id', openSlotId)
      .single();

    if (slotErr || !openSlotRow) {
      return { ok: false, error: `Open slot with id ${openSlotId} not found` };
    }

    const openSlot = openSlotRow as any;
    const room = unwrap(openSlot.rooms);
    const cls = unwrap(openSlot.classes);
    const roomType = room?.type || 'classroom';
    const classSemester = cls?.semester;
    const classDept = cls?.department;

    // 2. Fetch all faculty profiles joined with users
    const { data: facultyProfiles, error: facErr } = await db()
      .from('faculty_profiles')
      .select('id, user_id, department, required_hours, max_hours, users!inner(name)');

    if (facErr || !facultyProfiles) {
      return { ok: false, error: `Database failure fetching faculty: ${facErr?.message}` };
    }

    // 3. Pre-fetch class subjects for this class
    const { data: classSubjectsData } = await db()
      .from('class_subjects')
      .select('subject_id')
      .eq('class_id', openSlot.class_id);

    const classSubjectIds = (classSubjectsData || []).map((cs: any) => cs.subject_id);

    // 4. Pre-fetch subjects info
    const { data: subjectsData } = await db().from('subjects').select('*');
    const subjectsMap = new Map<string, any>();
    (subjectsData || []).forEach((s: any) => subjectsMap.set(s.id, s));

    // 5. Evaluate each faculty candidate
    const recommendations: Recommendation[] = [];

    for (const fac of facultyProfiles as any[]) {
      // Fetch faculty_subjects for candidate
      const { data: facSubjData } = await db()
        .from('faculty_subjects')
        .select('subject_id')
        .eq('faculty_id', fac.id);

      const facSubjectIds = (facSubjData || []).map((fs: any) => fs.subject_id);

      // Eligible subjects = subject taught by faculty AND assigned to class AND matching room type
      const eligibleSubjectIds = facSubjectIds.filter((subId) => {
        if (!classSubjectIds.includes(subId)) return false;
        const sub = subjectsMap.get(subId);
        if (!sub) return false;
        return sub.type === roomType;
      });

      const canTeachEligibleSubject = eligibleSubjectIds.length > 0;

      // Check if candidate passes live conflict checks for at least one eligible subject
      let hasNoConflicts = false;
      if (canTeachEligibleSubject) {
        for (const subId of eligibleSubjectIds) {
          const checkRes = await checkConflicts({
            openSlotId: openSlot.id,
            facultyId: fac.id,
            subjectId: subId,
          });
          if (checkRes.ok && checkRes.data.ok) {
            hasNoConflicts = true;
            break;
          }
        }
      }

      // Is available check (pass any check where faculty isn't busy)
      // Check first eligible subject or test conflict check
      let isAvailable = false;
      if (canTeachEligibleSubject && eligibleSubjectIds.length > 0) {
        const testRes = await checkConflicts({
          openSlotId: openSlot.id,
          facultyId: fac.id,
          subjectId: eligibleSubjectIds[0],
        });
        if (testRes.ok) {
          const facFreeCheck = testRes.data.checks.find((c) => c.key === 'faculty_free');
          isAvailable = facFreeCheck ? facFreeCheck.passed : false;
        }
      }

      // Semester suitability check: does candidate teach any subject of the same semester/dept?
      const isSemesterSuitable = facSubjectIds.some((subId) => {
        const sub = subjectsMap.get(subId);
        if (!sub) return false;
        return sub.semester === classSemester || (classDept && sub.department === classDept);
      });

      // Workload below target check
      const { count: assignedCount } = await db()
        .from('timetable')
        .select('id', { count: 'exact', head: true })
        .eq('faculty_id', fac.id);

      const assignedHours = assignedCount || 0;
      const isWorkloadBelowTarget = assignedHours < fac.required_hours;

      const rec = calculateFacultyRecommendation({
        facultyId: fac.id,
        facultyName: fac.users.name,
        isAvailable,
        canTeachEligibleSubject,
        hasNoConflicts,
        isSemesterSuitable,
        isWorkloadBelowTarget,
      });

      recommendations.push(rec);
    }

    // Sort by score descending, then by facultyName
    recommendations.sort((a, b) => b.score - a.score || a.facultyName.localeCompare(b.facultyName));

    return { ok: true, data: recommendations };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `getRecommendations failed: ${message}` };
  }
}
