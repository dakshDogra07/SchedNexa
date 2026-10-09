/**
 * services/setup.ts — Setup CRUD services for entities (Faculty, Subjects, Classes, Rooms).
 *
 * Implements:
 *   - listFaculty
 *   - listSubjects
 *   - listClasses
 *   - listRooms
 *   - upsertFaculty
 *   - upsertSubject
 *   - upsertClass
 *   - upsertRoom
 */

import type {
  ApiResult,
  Class,
  FacultyProfile,
  FacultyView,
  Room,
  Subject,
} from '@shared/types';
import { db } from '../lib/db.js';
import {
  ListClassesInput,
  ListFacultyInput,
  ListRoomsInput,
  ListSubjectsInput,
  UpsertClassInputSchema,
  UpsertFacultyInputSchema,
  UpsertRoomInputSchema,
  UpsertSubjectInputSchema,
} from '../schemas.js';

// ─── List Functions ──────────────────────────────────────────────────

export async function listFaculty(
  input: unknown
): Promise<ApiResult<FacultyView[]>> {
  try {
    const parsed = ListFacultyInput.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: `Invalid input: ${parsed.error.issues.map((i) => i.message).join('; ')}`,
      };
    }

    const { data, error } = await db()
      .from('faculty_profiles')
      .select('id, user_id, department, required_hours, max_hours, users!inner(name, email)');

    if (error) {
      return { ok: false, error: `Database failure: ${error.message}` };
    }

    if (!data) {
      return { ok: true, data: [] };
    }

    const views: FacultyView[] = data.map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      department: row.department,
      required_hours: row.required_hours,
      max_hours: row.max_hours,
      name: row.users.name,
      email: row.users.email,
    }));

    views.sort((a, b) => a.name.localeCompare(b.name));

    return { ok: true, data: views };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `listFaculty failed: ${message}` };
  }
}

export async function listSubjects(
  input: unknown
): Promise<ApiResult<Subject[]>> {
  try {
    const parsed = ListSubjectsInput.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: `Invalid input: ${parsed.error.issues.map((i) => i.message).join('; ')}`,
      };
    }

    const { data, error } = await db().from('subjects').select('*').order('semester').order('code');

    if (error) {
      return { ok: false, error: `Database failure: ${error.message}` };
    }

    return { ok: true, data: (data as Subject[]) || [] };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `listSubjects failed: ${message}` };
  }
}

export async function listClasses(
  input: unknown
): Promise<ApiResult<Class[]>> {
  try {
    const parsed = ListClassesInput.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: `Invalid input: ${parsed.error.issues.map((i) => i.message).join('; ')}`,
      };
    }

    const { data, error } = await db().from('classes').select('*').order('semester').order('name');

    if (error) {
      return { ok: false, error: `Database failure: ${error.message}` };
    }

    return { ok: true, data: (data as Class[]) || [] };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `listClasses failed: ${message}` };
  }
}

export async function listRooms(
  input: unknown
): Promise<ApiResult<Room[]>> {
  try {
    const parsed = ListRoomsInput.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: `Invalid input: ${parsed.error.issues.map((i) => i.message).join('; ')}`,
      };
    }

    const { data, error } = await db().from('rooms').select('*').order('name');

    if (error) {
      return { ok: false, error: `Database failure: ${error.message}` };
    }

    return { ok: true, data: (data as Room[]) || [] };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `listRooms failed: ${message}` };
  }
}

// ─── Upsert Functions ────────────────────────────────────────────────

export async function upsertFaculty(
  input: unknown
): Promise<ApiResult<FacultyProfile>> {
  try {
    const parsed = UpsertFacultyInputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: `Invalid input: ${parsed.error.issues.map((i) => i.message).join('; ')}`,
      };
    }

    const { id, user_id, department, required_hours, max_hours } = parsed.data;

    // Verify user_id exists
    const { data: user, error: userErr } = await db()
      .from('users')
      .select('id')
      .eq('id', user_id)
      .single();

    if (userErr || !user) {
      return { ok: false, error: `User with id ${user_id} not found` };
    }

    let resultData: FacultyProfile | null = null;

    if (id) {
      // Update existing
      const { data: updated, error: updateErr } = await db()
        .from('faculty_profiles')
        .update({
          user_id,
          department: department ?? null,
          required_hours,
          max_hours,
        })
        .eq('id', id)
        .select()
        .single();

      if (updateErr) {
        return { ok: false, error: `Database failure: ${updateErr.message}` };
      }
      if (!updated) {
        return { ok: false, error: `Faculty profile with id ${id} not found` };
      }
      resultData = updated as FacultyProfile;
    } else {
      // Create new
      const { data: inserted, error: insertErr } = await db()
        .from('faculty_profiles')
        .insert({
          user_id,
          department: department ?? null,
          required_hours,
          max_hours,
        })
        .select()
        .single();

      if (insertErr) {
        return { ok: false, error: `Database failure: ${insertErr.message}` };
      }
      resultData = inserted as FacultyProfile;
    }

    return { ok: true, data: resultData };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `upsertFaculty failed: ${message}` };
  }
}

export async function upsertSubject(
  input: unknown
): Promise<ApiResult<Subject>> {
  try {
    const parsed = UpsertSubjectInputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: `Invalid input: ${parsed.error.issues.map((i) => i.message).join('; ')}`,
      };
    }

    const { id, name, code, department, semester, type, hours_per_week } = parsed.data;

    let resultData: Subject | null = null;

    if (id) {
      const { data: updated, error: updateErr } = await db()
        .from('subjects')
        .update({
          name,
          code,
          department: department ?? null,
          semester,
          type,
          hours_per_week,
        })
        .eq('id', id)
        .select()
        .single();

      if (updateErr) {
        return { ok: false, error: `Database failure: ${updateErr.message}` };
      }
      if (!updated) {
        return { ok: false, error: `Subject with id ${id} not found` };
      }
      resultData = updated as Subject;
    } else {
      const { data: inserted, error: insertErr } = await db()
        .from('subjects')
        .insert({
          name,
          code,
          department: department ?? null,
          semester,
          type,
          hours_per_week,
        })
        .select()
        .single();

      if (insertErr) {
        return { ok: false, error: `Database failure: ${insertErr.message}` };
      }
      resultData = inserted as Subject;
    }

    return { ok: true, data: resultData };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `upsertSubject failed: ${message}` };
  }
}

export async function upsertClass(
  input: unknown
): Promise<ApiResult<Class>> {
  try {
    const parsed = UpsertClassInputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: `Invalid input: ${parsed.error.issues.map((i) => i.message).join('; ')}`,
      };
    }

    const { id, name, department, semester, student_count } = parsed.data;

    let resultData: Class | null = null;

    if (id) {
      const { data: updated, error: updateErr } = await db()
        .from('classes')
        .update({
          name,
          department: department ?? null,
          semester,
          student_count,
        })
        .eq('id', id)
        .select()
        .single();

      if (updateErr) {
        return { ok: false, error: `Database failure: ${updateErr.message}` };
      }
      if (!updated) {
        return { ok: false, error: `Class with id ${id} not found` };
      }
      resultData = updated as Class;
    } else {
      const { data: inserted, error: insertErr } = await db()
        .from('classes')
        .insert({
          name,
          department: department ?? null,
          semester,
          student_count,
        })
        .select()
        .single();

      if (insertErr) {
        return { ok: false, error: `Database failure: ${insertErr.message}` };
      }
      resultData = inserted as Class;
    }

    return { ok: true, data: resultData };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `upsertClass failed: ${message}` };
  }
}

export async function upsertRoom(
  input: unknown
): Promise<ApiResult<Room>> {
  try {
    const parsed = UpsertRoomInputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: `Invalid input: ${parsed.error.issues.map((i) => i.message).join('; ')}`,
      };
    }

    const { id, name, capacity, type, equipment } = parsed.data;

    let resultData: Room | null = null;

    if (id) {
      const { data: updated, error: updateErr } = await db()
        .from('rooms')
        .update({
          name,
          capacity,
          type,
          equipment,
        })
        .eq('id', id)
        .select()
        .single();

      if (updateErr) {
        return { ok: false, error: `Database failure: ${updateErr.message}` };
      }
      if (!updated) {
        return { ok: false, error: `Room with id ${id} not found` };
      }
      resultData = updated as Room;
    } else {
      const { data: inserted, error: insertErr } = await db()
        .from('rooms')
        .insert({
          name,
          capacity,
          type,
          equipment,
        })
        .select()
        .single();

      if (insertErr) {
        return { ok: false, error: `Database failure: ${insertErr.message}` };
      }
      resultData = inserted as Room;
    }

    return { ok: true, data: resultData };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `upsertRoom failed: ${message}` };
  }
}
