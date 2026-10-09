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

export const MoveTimetableEntryInput = z
  .object({
    timetableId: z.string().min(1, 'timetableId is required'),
    day: z.number().int().min(1, 'day must be between 1 and 5').max(5, 'day must be between 1 and 5'),
    slotId: z.string().min(1, 'slotId is required'),
    roomId: z.string().optional(),
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

// ─── Room services schemas ──────────────────────────────────────────
export const GetRoomAvailabilityInput = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
  })
// ─── Recommendation services schemas ────────────────────────────────
export const GetRecommendationsInput = z
  .object({
    openSlotId: z.string().min(1, 'openSlotId is required'),
  })
  .strict();


// ─── Setup services schemas ──────────────────────────────────────────
export const ListFacultyInput = z.object({}).strict();
export const ListSubjectsInput = z.object({}).strict();
export const ListClassesInput = z.object({}).strict();
export const ListRoomsInput = z.object({}).strict();

export const UpsertFacultyInputSchema = z
  .object({
    id: z.string().optional(),
    user_id: z.string().min(1, 'user_id is required'),
    department: z.string().nullable().optional(),
    required_hours: z.number().int().min(0, 'required_hours must be non-negative'),
    max_hours: z.number().int().min(0, 'max_hours must be non-negative'),
  })
  .strict()
  .refine((data) => data.max_hours >= data.required_hours, {
    message: 'max_hours must be greater than or equal to required_hours',
    path: ['max_hours'],
  });

export const UpsertSubjectInputSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().min(1, 'name is required'),
    code: z.string().min(1, 'code is required'),
    department: z.string().nullable().optional(),
    semester: z.number().int().min(1, 'semester must be at least 1'),
    type: z.enum(['theory', 'lab']),
    hours_per_week: z.number().int().min(1, 'hours_per_week must be at least 1'),
  })
  .strict()
  .refine(
    (data) => {
      if (data.type === 'lab') {
        return data.hours_per_week % 2 === 0;
      }
      return true;
    },
    {
      message: 'hours_per_week for a lab subject must be an even number',
      path: ['hours_per_week'],
    }
  );

export const UpsertClassInputSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().min(1, 'name is required'),
    department: z.string().nullable().optional(),
    semester: z.number().int().min(1, 'semester must be at least 1'),
    student_count: z.number().int().min(1, 'student_count must be at least 1'),
  })
  .strict();

export const UpsertRoomInputSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().min(1, 'name is required'),
    capacity: z.number().int().min(1, 'capacity must be at least 1'),
    type: z.enum(['classroom', 'lab']),
    equipment: z.array(z.string()),
  })
  .strict()
  .refine(
    (data) => {
      if (data.type === 'classroom') {
        return data.equipment.length === 0;
      }
      return true;
    },
    {
      message: 'classrooms must have empty equipment',
      path: ['equipment'],
    }
  );

// ─── Lab booking services schemas ───────────────────────────────────
export const CreateLabBookingInput = z
  .object({
    roomId: z.string().min(1, 'roomId is required'),
    facultyId: z.string().min(1, 'facultyId is required'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
    slotId: z.string().min(1, 'slotId is required'),
    purpose: z.string().min(1, 'purpose is required'),
    equipment: z.array(z.string()),
  })
  .strict();

export const ListLabBookingsInput = z
  .object({
    facultyId: z.string().optional(),
  })
  .strict();

export const DecideLabBookingInput = z
  .object({
    bookingId: z.string().min(1, 'bookingId is required'),
    status: z.enum(['pending', 'approved', 'rejected']),
  })
// ─── Dashboard stats services schemas ──────────────────────────────
// ─── Dashboard stats services schemas ──────────────────────────────
export const GetDashboardStatsInput = z.object({}).strict();

// ─── Analytics services schemas ────────────────────────────────────
export const GetAnalyticsInput = z.object({}).strict();











