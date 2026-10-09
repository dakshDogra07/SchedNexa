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

// ─── Open Slots services schemas ──────────────────────────────────────
export const GetOpenSlotsInput = z
  .object({
    facultyId: z.string().optional(),
    status: z.enum(['open', 'booked', 'cancelled']).optional(),
  })
  .strict();

export const CheckConflictsInput = z
  .object({
    openSlotId: z.string().min(1, 'openSlotId is required'),
    facultyId: z.string().min(1, 'facultyId is required'),
    subjectId: z.string().min(1, 'subjectId is required'),
  })
  .strict();

export const BookSlotInput = z
  .object({
    openSlotId: z.string().min(1, 'openSlotId is required'),
    facultyId: z.string().min(1, 'facultyId is required'),
    subjectId: z.string().min(1, 'subjectId is required'),
  })
  .strict();

// ─── Notification services schemas ──────────────────────────────────
export const GetNotificationsInput = z
  .object({
    userId: z.string().min(1, 'userId is required'),
  })
  .strict();

export const MarkNotificationReadInput = z
  .object({
    notificationId: z.string().min(1, 'notificationId is required'),
  })
  .strict();

// ─── Demo services schemas ──────────────────────────────────────────
export const GetDemoUsersInput = z.object({}).strict();
export const ResetDemoInput = z.object({}).strict();

// ─── Workload services schemas ──────────────────────────────────────
export const GetWorkloadInput = z
  .object({
    facultyId: z.string().optional(),
  })
  .strict();




