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

import {
  buildDemoTimetable,
  DAYS,
  TIME_SLOT_DEFS,
  SEED_CLASSES,
  SEED_FACULTY,
  SEED_ROOMS,
  SEED_SUBJECTS,
  SEED_USERS,
  SEED_FACULTY_SUBJECTS,
} from './demo-timetable';

// In-memory store of timetable entries initialized with all 314 sessions
let activeTimetable: TimetableEntry[] = buildDemoTimetable();
let activeOpenSlots: OpenSlot[] = [];
let activeExtraLectures: ExtraLecture[] = [];
let activeNotifications: Notification[] = [];
let activeLabBookings: LabBooking[] = [
  {
    id: 'l0000000-0000-0000-0000-000000000001',
    room_id: '50000000-0000-0000-0000-000000000005',
    faculty_id: '20000000-0000-0000-0000-000000000001',
    date: '2026-10-14',
    slot_id: 'a0000000-0000-0000-0000-000000000006',
    end_slot_id: 'a0000000-0000-0000-0000-000000000007',
    purpose: 'Specialized Advanced Computing Lab',
    equipment: ['Computers (35)', 'LAN', 'Projector'],
    status: 'approved',
  },
];

// In-memory entities store for Setup CRUD initialized from real master datasets
let activeFacultyList: FacultyView[] = [...SEED_FACULTY];
let activeSubjectsList: Subject[] = [...SEED_SUBJECTS];
let activeClassesList: Class[] = [...SEED_CLASSES];
let activeRoomsList: Room[] = [...SEED_ROOMS];

// Mock Handlers satisfying ApiContract
export const mockHandlers: {
  [K in keyof ApiContract]: (input: ApiContract[K]['input']) => Promise<ApiResult<ApiContract[K]['output']>>;
} = {
  ping: async () => {
    return { ok: true, data: { time: new Date().toISOString() } };
  },

  getDemoUsers: async () => {
    return { ok: true, data: SEED_USERS };
  },

  resetDemo: async () => {
    activeTimetable = buildDemoTimetable();
    activeOpenSlots = [];
    activeExtraLectures = [];
    activeNotifications = [];
    return { ok: true, data: { message: 'Demo data reset successfully to clean seeded state.' } };
  },

  generateTimetable: async () => {
    activeTimetable = buildDemoTimetable();
    const result: GenerationResult = {
      lecturesPlaced: activeTimetable.length,
      conflicts: 0,
      unscheduled: [],
      facultyAtFullLoad: activeFacultyList.length,
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
    const d = new Date(input.date);
    const day = d.getUTCDay() === 0 ? 7 : d.getUTCDay();

    let rows = activeTimetable.filter((r) => r.day === day);
    if (input.classId) rows = rows.filter((r) => r.classId === input.classId);
    if (input.facultyId) rows = rows.filter((r) => r.facultyId === input.facultyId);

    const schedule: ScheduleEntry[] = rows.map((r) => {
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
          const claimingFac = activeFacultyList.find((f) => f.id === extra.faculty_id);
          const claimingSub = activeSubjectsList.find((s) => s.id === extra.subject_id);
          subjName = claimingSub?.name || 'Extra Lecture';
          facName = claimingFac?.name || 'Faculty';
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
    const start = new Date(input.dateFrom);
    const end = new Date(input.dateTo);
    const affected: AffectedLecture[] = [];

    const curr = new Date(start);
    while (curr <= end) {
      const dayOfWeek = curr.getUTCDay();
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
    const faculty = activeFacultyList.find((f) => f.id === input.facultyId);
    const facultyName = faculty?.name || 'Faculty';

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
            leave_request_id: `lr000000-0000-0000-0000-${String(activeOpenSlots.length + 1).padStart(12, '0')}`,
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

          // Add notification for peer faculty members
          activeFacultyList
            .filter((f) => f.id !== input.facultyId)
            .forEach((otherFac) => {
              activeNotifications.unshift({
                id: `notif-0000-0000-0000-${String(activeNotifications.length + 1).padStart(12, '0')}`,
                user_id: otherFac.user_id,
                title: 'New Open Academic Slot Available',
                message: `${facultyName} marked leave on ${dateStr} for ${r.subjectName} (${r.className}, ${r.startTime}-${r.endTime}). Click to claim this slot for your subject!`,
                type: 'open_slot',
                related_id: newSlot.id,
                read: false,
                created_at: new Date().toISOString(),
              });
            });
        }
      }
      curr.setUTCDate(curr.getUTCDate() + 1);
    }

    return { ok: true, data: createdSlots };
  },

  getOpenSlots: async (input) => {
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
        slotNo: timetableRow?.slotNo ?? 1,
        endSlotNo: timetableRow?.slotNo ?? 1,
        startTime: timetableRow?.startTime ?? '09:00',
        endTime: timetableRow?.endTime ?? '09:50',
        span: timetableRow?.blockId ? 2 : 1,
        classId: os.class_id,
        className: timetableRow?.className ?? 'Class',
        roomId: os.room_id,
        roomName: timetableRow?.roomName ?? 'Room',
        originalFacultyId: os.original_faculty_id,
        originalFacultyName: timetableRow?.facultyName ?? 'Faculty',
        originalSubjectId: timetableRow?.subjectId ?? '',
        originalSubjectName: timetableRow?.subjectName ?? 'Subject',
        status: os.status,
        score: input?.facultyId ? 90 : null,
      };
    });

    return { ok: true, data: views };
  },

  checkConflicts: async (input) => {
    const checks: CheckResult = {
      ok: true,
      checks: [
        {
          key: 'faculty_free',
          label: 'Faculty Free',
          passed: true,
          detail: 'Faculty has no other timetable lecture or lab booking at this slot.',
        },
        {
          key: 'subject_eligible',
          label: 'Subject Eligible',
          passed: true,
          detail: 'Subject belongs to curriculum and matches room type.',
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
          detail: 'Room is reserved exclusively for this open academic slot.',
        },
        {
          key: 'workload_within_max',
          label: 'Workload Within Max Limit',
          passed: true,
          detail: 'Faculty workload + 1 hour does not exceed maximum allowable weekly workload.',
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

    const claimingFac = activeFacultyList.find((f) => f.id === input.facultyId);
    const claimingSub = activeSubjectsList.find((s) => s.id === input.subjectId);

    if (claimingFac) {
      activeNotifications.unshift({
        id: `notif-0000-0000-0000-${String(activeNotifications.length + 1).padStart(12, '0')}`,
        user_id: claimingFac.user_id,
        title: 'Booking Confirmed!',
        message: `You successfully booked the open slot on ${slot.date} for ${claimingSub?.name || 'your subject'}.`,
        type: 'booking_confirmed',
        related_id: extra.id,
        read: false,
        created_at: new Date().toISOString(),
      });
    }

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

  getWorkload: async (input) => {
    const targets = input?.facultyId
      ? activeFacultyList.filter((f) => f.id === input.facultyId)
      : activeFacultyList;

    const rows: WorkloadRow[] = targets.map((fac) => {
      const assigned = activeTimetable.filter((r) => r.facultyId === fac.id).length;
      const extraLectures = activeExtraLectures.filter(
        (el) => el.faculty_id === fac.id && el.status === 'confirmed'
      );
      const extra = extraLectures.length;
      const total = assigned + extra;

      let status: WorkloadRow['status'] = 'ok';
      if (assigned < fac.required_hours) {
        status = 'under';
      } else if (total > fac.max_hours) {
        status = 'over';
      }

      return {
        facultyId: fac.id,
        facultyName: fac.name,
        requiredHours: fac.required_hours,
        assignedHours: assigned,
        extraHours: extra,
        totalHours: total,
        maxHours: fac.max_hours,
        status,
      };
    });

    return { ok: true, data: rows };
  },

  getRoomAvailability: async (input) => {
    const d = new Date(input.date);
    const dayOfWeek = d.getUTCDay() === 0 ? 7 : d.getUTCDay();
    const day = dayOfWeek >= 1 && dayOfWeek <= 5 ? dayOfWeek : 1;

    const timetableForDay = activeTimetable.filter((r) => r.day === day);

    const rooms = activeRoomsList.map((rm) => {
      const slots = TIME_SLOT_DEFS.map((slotDef) => {
        const slotId = `a0000000-0000-0000-0000-${String(slotDef.slotNo).padStart(12, '0')}`;
        const entry = timetableForDay.find((t) => t.roomId === rm.id && t.slotNo === slotDef.slotNo);

        if (!entry) {
          return {
            slotId,
            slotNo: slotDef.slotNo,
            state: 'free' as const,
            who: null,
          };
        }

        const openSlot = activeOpenSlots.find((os) => os.timetable_id === entry.id && os.date === input.date);
        if (openSlot) {
          if (openSlot.status === 'open') {
            return {
              slotId,
              slotNo: slotDef.slotNo,
              state: 'open' as const,
              who: `Open Academic Slot (${entry.className})`,
            };
          } else if (openSlot.status === 'booked') {
            return {
              slotId,
              slotNo: slotDef.slotNo,
              state: 'busy' as const,
              who: `${entry.className} (Booked)`,
            };
          }
        }

        return {
          slotId,
          slotNo: slotDef.slotNo,
          state: 'busy' as const,
          who: `${entry.subjectName} (${entry.className})`,
        };
      });

      return {
        roomId: rm.id,
        roomName: rm.name,
        roomType: rm.type,
        slots,
      };
    });

    return { ok: true, data: { date: input.date, rooms } };
  },

  getRecommendations: async (input) => {
    const slot = activeOpenSlots.find((s) => s.id === input.openSlotId);
    const recs: Recommendation[] = activeFacultyList.slice(0, 3).map((f, idx) => ({
      facultyId: f.id,
      facultyName: f.name,
      score: 95 - idx * 10,
      reasons: [
        'Curriculum-aligned for course section',
        'Available slot with no scheduling collision',
        `Current workload (${activeTimetable.filter((r) => r.facultyId === f.id).length} hrs) conforms to maximum (${f.max_hours} hrs)`,
      ],
    }));

    return { ok: true, data: recs };
  },

  listFaculty: async () => {
    return { ok: true, data: activeFacultyList };
  },

  listSubjects: async () => {
    return { ok: true, data: activeSubjectsList };
  },

  listClasses: async () => {
    return { ok: true, data: activeClassesList };
  },

  listRooms: async () => {
    return { ok: true, data: activeRoomsList };
  },

  upsertFaculty: async (input) => {
    const id = input.id || `20000000-0000-0000-0000-${String(activeFacultyList.length + 1).padStart(12, '0')}`;
    const fac: FacultyProfile = {
      id,
      user_id: input.user_id,
      department: input.department,
      required_hours: input.required_hours,
      max_hours: input.max_hours,
    };
    const existing = activeFacultyList.find((f) => f.id === id);
    if (existing) {
      Object.assign(existing, fac);
    } else {
      activeFacultyList.push({
        ...fac,
        name: 'Faculty Member',
        email: `faculty${id.slice(-4)}@schednexa.edu`,
      });
    }
    return { ok: true, data: fac };
  },

  upsertSubject: async (input) => {
    const id = input.id || `30000000-0000-0000-0000-${String(activeSubjectsList.length + 1).padStart(12, '0')}`;
    const sub: Subject = {
      id,
      name: input.name,
      code: input.code,
      department: input.department,
      semester: input.semester,
      type: input.type,
      hours_per_week: input.hours_per_week,
    };
    const existing = activeSubjectsList.find((s) => s.id === id);
    if (existing) {
      Object.assign(existing, sub);
    } else {
      activeSubjectsList.push(sub);
    }
    return { ok: true, data: sub };
  },

  upsertClass: async (input) => {
    const id = input.id || `40000000-0000-0000-0000-${String(activeClassesList.length + 1).padStart(12, '0')}`;
    const cls: Class = {
      id,
      name: input.name,
      department: input.department,
      semester: input.semester,
      student_count: input.student_count,
    };
    const existing = activeClassesList.find((c) => c.id === id);
    if (existing) {
      Object.assign(existing, cls);
    } else {
      activeClassesList.push(cls);
    }
    return { ok: true, data: cls };
  },

  upsertRoom: async (input) => {
    const id = input.id || `50000000-0000-0000-0000-${String(activeRoomsList.length + 1).padStart(12, '0')}`;
    const room: Room = {
      id,
      name: input.name,
      capacity: input.capacity,
      type: input.type,
      equipment: input.equipment,
    };
    const existing = activeRoomsList.find((r) => r.id === id);
    if (existing) {
      Object.assign(existing, room);
    } else {
      activeRoomsList.push(room);
    }
    return { ok: true, data: room };
  },

  moveTimetableEntry: async (input) => {
    const entry = activeTimetable.find((e) => e.id === input.timetableId);
    if (!entry) {
      return { ok: false, error: 'Timetable entry not found' };
    }

    const slotDef = TIME_SLOT_DEFS.find(
      (ts) => `a0000000-0000-0000-0000-${String(ts.slotNo).padStart(12, '0')}` === input.slotId
    );
    const targetSlotNo = slotDef ? slotDef.slotNo : 1;
    const targetRoomId = input.roomId || entry.roomId;

    const conflicts: string[] = [];

    const roomConflict = activeTimetable.find(
      (e) =>
        e.id !== input.timetableId &&
        e.day === input.day &&
        e.slotNo === targetSlotNo &&
        e.roomId === targetRoomId
    );
    if (roomConflict) {
      conflicts.push(
        `Room conflict: ${roomConflict.roomName} is already occupied by ${roomConflict.className} (${roomConflict.subjectName}).`
      );
    }

    const facultyConflict = activeTimetable.find(
      (e) =>
        e.id !== input.timetableId &&
        e.day === input.day &&
        e.slotNo === targetSlotNo &&
        e.facultyId === entry.facultyId
    );
    if (facultyConflict) {
      conflicts.push(
        `Faculty conflict: ${entry.facultyName} is already teaching ${facultyConflict.subjectName} for ${facultyConflict.className} in ${facultyConflict.roomName}.`
      );
    }

    const classConflict = activeTimetable.find(
      (e) =>
        e.id !== input.timetableId &&
        e.day === input.day &&
        e.slotNo === targetSlotNo &&
        e.classId === entry.classId
    );
    if (classConflict) {
      conflicts.push(
        `Class conflict: ${entry.className} is already scheduled for ${classConflict.subjectName} in ${classConflict.roomName}.`
      );
    }

    if (conflicts.length > 0) {
      return { ok: true, data: { ok: false, conflicts } };
    }

    entry.day = input.day;
    entry.slotNo = targetSlotNo;
    entry.slotId = input.slotId;
    if (input.roomId) {
      const rm = activeRoomsList.find((r) => r.id === input.roomId);
      entry.roomId = input.roomId;
      if (rm) entry.roomName = rm.name;
    }

    return { ok: true, data: { ok: true, conflicts: [] } };
  },

  createLabBooking: async (input) => {
    const booking: LabBooking = {
      id: `l0000000-0000-0000-0000-${String(activeLabBookings.length + 1).padStart(12, '0')}`,
      room_id: input.roomId,
      faculty_id: input.facultyId,
      date: input.date,
      slot_id: input.slotId,
      end_slot_id: input.slotId,
      purpose: input.purpose,
      equipment: input.equipment,
      status: 'approved',
    };
    activeLabBookings.unshift(booking);

    activeNotifications.unshift({
      id: `notif-0000-0000-0000-${String(activeNotifications.length + 1).padStart(12, '0')}`,
      user_id: input.facultyId,
      title: 'Lab Booking Approved',
      message: `Your booking for laboratory facilities on ${input.date} has been confirmed.`,
      type: 'lab_booking',
      related_id: booking.id,
      read: false,
      created_at: new Date().toISOString(),
    });

    return { ok: true, data: booking };
  },

  listLabBookings: async (input) => {
    let list = activeLabBookings;
    if (input?.facultyId) {
      list = list.filter((b) => b.faculty_id === input.facultyId);
    }
    return { ok: true, data: list };
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
      lectures: activeTimetable.length,
      conflicts: 0,
      roomUtilizationPct: 84,
      openSlotsFilled: activeExtraLectures.length,
      hoursSaved: activeExtraLectures.length * 2,
    };
    return { ok: true, data: stats };
  },

  getAnalytics: async () => {
    const data: AnalyticsData = {
      lectures: activeTimetable,
      classes: activeClassesList,
      faculty: activeFacultyList,
      rooms: activeRoomsList,
    };
    return { ok: true, data };
  },
};
