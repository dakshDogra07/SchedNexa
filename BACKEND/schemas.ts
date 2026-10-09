import { z } from 'zod';

// ─── ping ───────────────────────────────────────────────────────────
export const PingInput = z.object({}).strict();

// ─── Timetable services schemas ──────────────────────────────────────
export const GenerateTimetableInput = z.object({}).strict();

export const GetTimetableInput = z
  .object({
    classId: z.string().optional(),
    facultyId: z.string().optional(),
    roomId: z.string().optional(),
  })
  .strict();

export const GetEffectiveScheduleInput = z
  .object({
    date: z.string().min(1, 'Date is required'),
    facultyId: z.string().optional(),
    classId: z.string().optional(),
  })
  .strict();

// ─── Leave services schemas ──────────────────────────────────────────
export const GetLeaveImpactInput = z
  .object({
    facultyId: z.string().min(1, 'facultyId is required'),
    dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'dateFrom must be YYYY-MM-DD'),
    dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'dateTo must be YYYY-MM-DD'),
  })
  .strict();

export const MarkLeaveInput = z
  .object({
    facultyId: z.string().min(1, 'facultyId is required'),
    dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'dateFrom must be YYYY-MM-DD'),
    dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'dateTo must be YYYY-MM-DD'),
    reason: z.string().optional(),
  })
  .strict();
