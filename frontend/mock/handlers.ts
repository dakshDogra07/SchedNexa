import type {
  ApiContract,
  ApiResult,
  DemoUser,
  GenerationResult,
  TimetableEntry,
  ScheduleEntry,
  AffectedLecture,
  OpenSlot,
  OpenSlotView,
  CheckResult,
  ExtraLecture,
  Notification,
  WorkloadRow,
  RoomAvailability,
  Recommendation,
  FacultyView,
  Subject,
  Class,
  Room,
  FacultyProfile,
  MoveResult,
  LabBooking,
  DashboardStats,
  AnalyticsData,
} from '@shared/types';

import { buildDemoTimetable, DAYS, TIME_SLOT_DEFS } from './demo-timetable';

// In-memory store of timetable entries
let activeTimetable = buildDemoTimetable();
let activeOpenSlots: OpenSlot[] = [];
let activeExtraLectures: ExtraLecture[] = [];
let activeNotifications: Notification[] = [];

// Mock Handlers satisfying ApiContract
export const mockHandlers: {
  [K in keyof ApiContract]: (input: ApiContract[K]['input']) => Promise<ApiResult<ApiContract[K]['output']>>;
} = {
  ping: async () => {
    return { ok: true, data: { time: new Date().toISOString() } };
  },

  getDemoUsers: async () => {
    const users: DemoUser[] = [
      { id: '10000000-0000-0000-0000-000000000001', name: 'Admin', role: 'admin' },
      { id: '10000000-0000-0000-0000-000000000002', name: 'Dr. Sharma', role: 'faculty', facultyId: '20000000-0000-0000-0000-000000000001' },
      { id: '10000000-0000-0000-0000-000000000003', name: 'Prof. Kaur', role: 'faculty', facultyId: '20000000-0000-0000-0000-000000000002' },
    ];
    return { ok: true, data: users };
  },

  resetDemo: async () => {
    activeTimetable = buildDemoTimetable();
    activeOpenSlots = [];
    activeExtraLectures = [];
    return { ok: true, data: { message: 'Demo data reset successfully to fixed seed state.' } };
  },

  generateTimetable: async () => {
    activeTimetable = buildDemoTimetable();
    const result: GenerationResult = {
      lecturesPlaced: 100,
      conflicts: 0,
      unscheduled: [],
      facultyAtFullLoad: 5,
    };
    return { ok: true, data: result };
  },

  getTimetable: async (input) => {
    let rows = activeTimetable;
    if (input.classId) rows = rows.filter((r) => r.classId === input.classId);
    if (input.facultyId) rows = rows.filter((r) => r.facultyId === input.facultyId);
    if (input.roomId) rows = rows.filter((r) => r.roomId === input.roomId);
    return { ok: true, data: rows };
  },

  getEffectiveSchedule: async (input) => {
    // Map date to weekday (1=Mon..5=Fri)
    const d = new Date(input.date);
    const day = d.getUTCDay() === 0 ? 7 : d.getUTCDay();

    let rows = activeTimetable.filter((r) => r.day === day);
    if (input.classId) rows = rows.filter((r) => r.classId === input.classId);
    if (input.facultyId) rows = rows.filter((r) => r.facultyId === input.facultyId);

    const schedule: ScheduleEntry[] = rows.map((r) => {
      // Check if open slot exists for this timetable entry on this date
      const openSlot = activeOpenSlots.find((os) => os.timetable_id === r.id && os.date === input.date);
      const extra = openSlot ? activeExtraLectures.find((el) => el.open_slot_id === openSlot.id) : null;

      let state: ScheduleEntry['state'] = 'normal';
      let subjName = r.subjectName;
      let facName = r.facultyName;
      let subjId = r.subjectId;
      let facId = r.facultyId;

      if (openSlot) {
        if (openSlot.status === 'open') {
          state = 'open';
          subjName = null as any;
          facName = null as any;
          subjId = null as any;
          facId = null as any;
        } else if (openSlot.status === 'booked' && extra) {
          state = 'extra';
          subjName = 'Operating Systems'; // Demo Kaur subject
          facName = 'Prof. Kaur';
          facId = extra.faculty_id;
          subjId = extra.subject_id;
        }
      }

      return {
        date: input.date,
        day: r.day,
        slotId: r.slotId,
        slotNo: r.slotNo,
        endSlotId: r.slotId,
        endSlotNo: r.slotNo,
        startTime: r.startTime,
        endTime: r.endTime,
        span: r.blockId ? 2 : 1,
        state,
        classId: r.classId,
        className: r.className,
        roomId: r.roomId,
        roomName: r.roomName,
        subjectId: subjId,
        subjectName: subjName,
        facultyId: facId,
        facultyName: facName,
        timetableId: r.id,
        openSlotId: openSlot?.id || null,
        extraLectureId: extra?.id || null,
        labBookingId: null,
        blockId: r.blockId,
      };
    });

    return { ok: true, data: schedule };
  },

  getLeaveImpact: async (input) => {
    // Generate dates between dateFrom and dateTo
    const start = new Date(input.dateFrom);
    const end = new Date(input.dateTo);
    const affected: AffectedLecture[] = [];

    const curr = new Date(start);
    while (curr <= end) {
      const dayOfWeek = curr.getUTCDay();
      // Skip weekends (0=Sun, 6=Sat)
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        const dateStr = curr.toISOString().split('T')[0];
        const rows = activeTimetable.filter(
          (r) => r.day === dayOfWeek && r.facultyId === input.facultyId
        );

        for (const r of rows) {
          affected.push({
            timetableId: r.id,
            date: dateStr,
            day: r.day,
            slotId: r.slotId,
            endSlotId: r.slotId,
            slotNo: r.slotNo,
            endSlotNo: r.slotNo,
            startTime: r.startTime,
            endTime: r.endTime,
            span: r.blockId ? 2 : 1,
            classId: r.classId,
            className: r.className,
            subjectId: r.subjectId,
            subjectName: r.subjectName,
            roomId: r.roomId,
            roomName: r.roomName,
          });
        }
      }
      curr.setUTCDate(curr.getUTCDate() + 1);
    }

    return { ok: true, data: affected };
  },

  markLeave: async (input) => {
    const start = new Date(input.dateFrom);
    const end = new Date(input.dateTo);
    const createdSlots: OpenSlot[] = [];

    const curr = new Date(start);
    while (curr <= end) {
      const dayOfWeek = curr.getUTCDay();
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        const dateStr = curr.toISOString().split('T')[0];
        const rows = activeTimetable.filter(
          (r) => r.day === dayOfWeek && r.facultyId === input.facultyId
        );

        for (const r of rows) {
          const slotId = `os000000-0000-0000-0000-${String(activeOpenSlots.length + 1).padStart(12, '0')}`;
          const newSlot: OpenSlot = {
            id: slotId,
            leave_request_id: 'lr000000-0000-0000-0000-000000000001',
            timetable_id: r.id,
            date: dateStr,
            slot_id: r.slotId,
            end_slot_id: r.slotId,
            class_id: r.classId,
            room_id: r.roomId,
            original_faculty_id: r.facultyId,
            status: 'open',
          };
          activeOpenSlots.push(newSlot);
          createdSlots.push(newSlot);

          // Add notification for other faculty members (e.g. Kaur)
          activeNotifications.unshift({
            id: `notif-0000-0000-0000-${String(activeNotifications.length + 1).padStart(12, '0')}`,
            user_id: '10000000-0000-0000-0000-000000000003', // Prof. Kaur
            title: 'New Open Academic Slot Available',
            message: `Dr. Sharma marked leave on ${dateStr} for ${r.subjectName} (${r.className}, ${r.startTime}-${r.endTime}). Click to claim this slot for your subject!`,
            type: 'open_slot',
            related_id: newSlot.id,
            read: false,
            created_at: new Date().toISOString(),
          });
        }
      }
      curr.setUTCDate(curr.getUTCDate() + 1);
    }

    return { ok: true, data: createdSlots };
  },

  getOpenSlots: async (input) => {
    // If no open slots exist yet, ensure the demo Sharma Friday slot is seeded for instant testing
    if (activeOpenSlots.length === 0) {
      const sharmaFridayRow = activeTimetable.find(
        (r) => r.day === 5 && r.slotNo === 2 && r.facultyName === 'Dr. Sharma'
      );
      if (sharmaFridayRow) {
        activeOpenSlots.push({
          id: 'os000000-0000-0000-0000-000000000001',
          leave_request_id: 'lr000000-0000-0000-0000-000000000001',
          timetable_id: sharmaFridayRow.id,
          date: '2026-10-16', // Demo Friday
          slot_id: sharmaFridayRow.slotId,
          end_slot_id: sharmaFridayRow.slotId,
          class_id: sharmaFridayRow.classId,
          room_id: sharmaFridayRow.roomId,
          original_faculty_id: sharmaFridayRow.facultyId,
          status: 'open',
        });
      }
    }

    const filtered = input?.status
      ? activeOpenSlots.filter((os) => os.status === input.status)
      : activeOpenSlots;

    const views: OpenSlotView[] = filtered.map((os) => {
      const timetableRow = activeTimetable.find((r) => r.id === os.timetable_id);
      return {
        id: os.id,
        leaveRequestId: os.leave_request_id,
        timetableId: os.timetable_id,
        date: os.date,
        slotId: os.slot_id,
        endSlotId: os.end_slot_id,
        slotNo: timetableRow?.slotNo ?? 2,
        endSlotNo: timetableRow?.slotNo ?? 2,
        startTime: timetableRow?.startTime ?? '09:50',
        endTime: timetableRow?.endTime ?? '10:40',
        span: timetableRow?.blockId ? 2 : 1,
        classId: os.class_id,
        className: timetableRow?.className ?? 'CSE-3A',
        roomId: os.room_id,
        roomName: timetableRow?.roomName ?? 'Room 101',
        originalFacultyId: os.original_faculty_id,
        originalFacultyName: timetableRow?.facultyName ?? 'Dr. Sharma',
        originalSubjectId: timetableRow?.subjectId ?? '30000000-0000-0000-0000-000000000001',
        originalSubjectName: timetableRow?.subjectName ?? 'DBMS',
        status: os.status,
        score: input?.facultyId ? 90 : null, // 90/100 recommendation match score
      };
    });

    return { ok: true, data: views };
  },

  checkConflicts: async (input) => {
    // 5 deterministic checks from engine/conflicts.ts
    const checks: CheckResult = {
      ok: true,
      checks: [
        {
          key: 'faculty_free',
          label: 'Faculty Free',
          passed: true,
          detail: 'Faculty has no other timetable lecture, confirmed extra lecture, or lab booking at this slot.',
        },
        {
          key: 'subject_eligible',
          label: 'Subject Eligible',
          passed: true,
          detail: 'Subject belongs to faculty assigned curriculum and matches room type (classroom/lab).',
        },
        {
          key: 'class_free',
          label: 'Class Free',
          passed: true,
          detail: 'Class is completely free and reserved for this open academic slot.',
        },
        {
          key: 'room_reserved',
          label: 'Room Reserved',
          passed: true,
          detail: 'Room 101 is reserved exclusively for this open slot.',
        },
        {
          key: 'workload_within_max',
          label: 'Workload Within Max Limit',
          passed: true,
          detail: 'Faculty current workload + 1 hour does not exceed maximum allowable weekly hours (24 hrs).',
        },
      ],
    };
    return { ok: true, data: checks };
  },

  bookSlot: async (input) => {
    const slot = activeOpenSlots.find((os) => os.id === input.openSlotId);
    if (!slot) {
      return { ok: false, error: 'Open slot not found or already cancelled' };
    }
    if (slot.status !== 'open') {
      return { ok: false, error: 'Open slot has already been booked by another faculty member' };
    }

    slot.status = 'booked';

    const extra: ExtraLecture = {
      id: `el000000-0000-0000-0000-${String(activeExtraLectures.length + 1).padStart(12, '0')}`,
      open_slot_id: input.openSlotId,
      faculty_id: input.facultyId,
      subject_id: input.subjectId,
      status: 'confirmed',
      created_at: new Date().toISOString(),
    };
    activeExtraLectures.push(extra);

    // Notify confirmation
    activeNotifications.unshift({
      id: `notif-0000-0000-0000-${String(activeNotifications.length + 1).padStart(12, '0')}`,
      user_id: '10000000-0000-0000-0000-000000000003', // Prof. Kaur
      title: 'Booking Confirmed!',
      message: `You successfully booked the open slot on ${slot.date} for Operating Systems (CSE-3A, Room 101).`,
      type: 'booking_confirmed',
      related_id: extra.id,
      read: false,
      created_at: new Date().toISOString(),
    });

    return { ok: true, data: extra };
  },

  getNotifications: async (input) => {
    const list = activeNotifications.filter((n) => n.user_id === input.userId);
    return { ok: true, data: list };
  },

  markNotificationRead: async (input) => {
    const notif = activeNotifications.find((n) => n.id === input.notificationId);
    if (notif) notif.read = true;
    return { ok: true, data: { done: true } };
  },

  getWorkload: async () => {
    return { ok: true, data: [] };
  },

  getRoomAvailability: async (input) => {
    const availability: RoomAvailability = {
      date: input.date,
      rooms: [],
    };
    return { ok: true, data: availability };
  },

  getRecommendations: async () => {
    return { ok: true, data: [] };
  },

  listFaculty: async () => {
    return { ok: true, data: [] };
  },

  listSubjects: async () => {
    return { ok: true, data: [] };
  },

  listClasses: async () => {
    return { ok: true, data: [] };
  },

  listRooms: async () => {
    return { ok: true, data: [] };
  },

  upsertFaculty: async (input) => {
    const profile: FacultyProfile = {
      id: input.id || '20000000-0000-0000-0000-000000000099',
      user_id: input.user_id,
      department: input.department,
      required_hours: input.required_hours,
      max_hours: input.max_hours,
    };
    return { ok: true, data: profile };
  },

  upsertSubject: async (input) => {
    const subject: Subject = {
      id: input.id || '30000000-0000-0000-0000-000000000099',
      name: input.name,
      code: input.code,
      department: input.department,
      semester: input.semester,
      type: input.type,
      hours_per_week: input.hours_per_week,
    };
    return { ok: true, data: subject };
  },

  upsertClass: async (input) => {
    const cls: Class = {
      id: input.id || '40000000-0000-0000-0000-000000000099',
      name: input.name,
      department: input.department,
      semester: input.semester,
      student_count: input.student_count,
    };
    return { ok: true, data: cls };
  },

  upsertRoom: async (input) => {
    const room: Room = {
      id: input.id || '50000000-0000-0000-0000-000000000099',
      name: input.name,
      capacity: input.capacity,
      type: input.type,
      equipment: input.equipment,
    };
    return { ok: true, data: room };
  },

  moveTimetableEntry: async () => {
    return { ok: true, data: { ok: true, conflicts: [] } };
  },

  createLabBooking: async (input) => {
    const booking: LabBooking = {
      id: 'l0000000-0000-0000-0000-000000000001',
      room_id: input.roomId,
      faculty_id: input.facultyId,
      date: input.date,
      slot_id: input.slotId,
      end_slot_id: 'a0000000-0000-0000-0000-000000000002',
      purpose: input.purpose,
      equipment: input.equipment,
      status: 'approved',
    };
    return { ok: true, data: booking };
  },

  listLabBookings: async () => {
    return { ok: true, data: [] };
  },

  decideLabBooking: async (input) => {
    const booking: LabBooking = {
      id: input.bookingId,
      room_id: '50000000-0000-0000-0000-000000000005',
      faculty_id: '20000000-0000-0000-0000-000000000001',
      date: '2026-10-12',
      slot_id: 'a0000000-0000-0000-0000-000000000001',
      end_slot_id: 'a0000000-0000-0000-0000-000000000002',
      purpose: 'Lab session',
      equipment: [],
      status: input.status,
    };
    return { ok: true, data: booking };
  },

  getDashboardStats: async () => {
    const stats: DashboardStats = {
      lectures: 100,
      conflicts: 0,
      roomUtilizationPct: 82,
      openSlotsFilled: 4,
      hoursSaved: 4,
    };
    return { ok: true, data: stats };
  },

  getAnalytics: async () => {
    return { ok: true, data: {} };
  },
};
