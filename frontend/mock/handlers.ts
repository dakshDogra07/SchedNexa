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
let activeLabBookings: LabBooking[] = [
  {
    id: 'l0000000-0000-0000-0000-000000000001',
    room_id: '50000000-0000-0000-0000-000000000005', // Lab 1
    faculty_id: '20000000-0000-0000-0000-000000000001', // Dr. Sharma
    date: '2026-10-14',
    slot_id: 'a0000000-0000-0000-0000-000000000006',
    end_slot_id: 'a0000000-0000-0000-0000-000000000007',
    purpose: 'Specialized Distributed Systems Lab Experiment',
    equipment: ['Computers (35)', 'LAN', 'Projector'],
    status: 'approved',
  },
];

// In-memory entities store for Setup CRUD
let activeFacultyList: FacultyView[] = [
  { id: '20000000-0000-0000-0000-000000000001', user_id: '10000000-0000-0000-0000-000000000002', name: 'Dr. Sharma', email: 'sharma@schednexa.edu', department: 'Computer Science', required_hours: 20, max_hours: 24 },
  { id: '20000000-0000-0000-0000-000000000002', user_id: '10000000-0000-0000-0000-000000000003', name: 'Prof. Kaur', email: 'kaur@schednexa.edu', department: 'Computer Science', required_hours: 20, max_hours: 24 },
  { id: '20000000-0000-0000-0000-000000000003', user_id: '10000000-0000-0000-0000-000000000004', name: 'Dr. Mehta', email: 'mehta@schednexa.edu', department: 'Computer Science', required_hours: 20, max_hours: 24 },
  { id: '20000000-0000-0000-0000-000000000004', user_id: '10000000-0000-0000-0000-000000000005', name: 'Dr. Verma', email: 'verma@schednexa.edu', department: 'Information Tech', required_hours: 20, max_hours: 24 },
  { id: '20000000-0000-0000-0000-000000000005', user_id: '10000000-0000-0000-0000-000000000006', name: 'Dr. Iyer', email: 'iyer@schednexa.edu', department: 'Computer Science', required_hours: 20, max_hours: 24 },
];

let activeSubjectsList: Subject[] = [
  { id: '30000000-0000-0000-0000-000000000001', name: 'Database Management Systems', code: 'CS301', department: 'Computer Science', semester: 3, type: 'theory', hours_per_week: 4 },
  { id: '30000000-0000-0000-0000-000000000002', name: 'Data Structures & Algorithms', code: 'CS302', department: 'Computer Science', semester: 3, type: 'theory', hours_per_week: 4 },
  { id: '30000000-0000-0000-0000-000000000005', name: 'DBMS Laboratory', code: 'CS305', department: 'Computer Science', semester: 3, type: 'lab', hours_per_week: 2 },
  { id: '30000000-0000-0000-0000-000000000007', name: 'Operating Systems', code: 'CS501', department: 'Computer Science', semester: 5, type: 'theory', hours_per_week: 4 },
  { id: '30000000-0000-0000-0000-000000000008', name: 'Computer Networks', code: 'CS502', department: 'Computer Science', semester: 5, type: 'theory', hours_per_week: 4 },
  { id: '30000000-0000-0000-0000-000000000011', name: 'Operating Systems Laboratory', code: 'CS505', department: 'Computer Science', semester: 5, type: 'lab', hours_per_week: 2 },
];

let activeClassesList: Class[] = [
  { id: '40000000-0000-0000-0000-000000000001', name: 'CSE-3A', department: 'Computer Science', semester: 3, student_count: 60 },
  { id: '40000000-0000-0000-0000-000000000002', name: 'CSE-3B', department: 'Computer Science', semester: 3, student_count: 58 },
  { id: '40000000-0000-0000-0000-000000000003', name: 'CSE-5A', department: 'Computer Science', semester: 5, student_count: 55 },
  { id: '40000000-0000-0000-0000-000000000004', name: 'CSE-5B', department: 'Computer Science', semester: 5, student_count: 54 },
];

let activeRoomsList: Room[] = [
  { id: '50000000-0000-0000-0000-000000000001', name: 'Room 101', capacity: 60, type: 'classroom', equipment: ['Projector', 'Whiteboard', 'Mic'] },
  { id: '50000000-0000-0000-0000-000000000002', name: 'Room 102', capacity: 60, type: 'classroom', equipment: ['Projector', 'Whiteboard'] },
  { id: '50000000-0000-0000-0000-000000000003', name: 'Room 103', capacity: 60, type: 'classroom', equipment: ['Projector', 'Whiteboard'] },
  { id: '50000000-0000-0000-0000-000000000004', name: 'Room 104', capacity: 60, type: 'classroom', equipment: ['Projector', 'Whiteboard'] },
  { id: '50000000-0000-0000-0000-000000000005', name: 'Lab 1', capacity: 30, type: 'lab', equipment: ['Computers (35)', 'LAN', 'Projector'] },
  { id: '50000000-0000-0000-0000-000000000006', name: 'Lab 2', capacity: 30, type: 'lab', equipment: ['Computers (35)', 'LAN', 'Projector'] },
];

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

  getWorkload: async (input) => {
    const facultyList = [
      { id: '20000000-0000-0000-0000-000000000001', name: 'Dr. Sharma', required: 20, max: 24 },
      { id: '20000000-0000-0000-0000-000000000002', name: 'Prof. Kaur', required: 20, max: 24 },
      { id: '20000000-0000-0000-0000-000000000003', name: 'Dr. Mehta', required: 20, max: 24 },
      { id: '20000000-0000-0000-0000-000000000004', name: 'Dr. Verma', required: 20, max: 24 },
      { id: '20000000-0000-0000-0000-000000000005', name: 'Dr. Iyer', required: 20, max: 24 },
    ];

    const targets = input?.facultyId
      ? facultyList.filter((f) => f.id === input.facultyId)
      : facultyList;

    const rows: WorkloadRow[] = targets.map((fac) => {
      // assigned_hours = count of timetable rows for that faculty (leave does not reduce it)
      const assigned = activeTimetable.filter((r) => r.facultyId === fac.id).length;
      
      // extra_hours = sum of span over confirmed extra lectures
      const extraLectures = activeExtraLectures.filter((el) => el.faculty_id === fac.id && el.status === 'confirmed');
      const extra = extraLectures.length; // 1 slot for theory

      const total = assigned + extra;

      let status: WorkloadRow['status'] = 'ok';
      if (assigned < fac.required) {
        status = 'under';
      } else if (total > fac.max) {
        status = 'over';
      }

      return {
        facultyId: fac.id,
        facultyName: fac.name,
        requiredHours: fac.required,
        assignedHours: assigned,
        extraHours: extra,
        totalHours: total,
        maxHours: fac.max,
        status,
      };
    });

    return { ok: true, data: rows };
  },

  getRoomAvailability: async (input) => {
    const demoRoomsList: Array<{ id: string; name: string; type: 'classroom' | 'lab'; capacity: number }> = [
      { id: '50000000-0000-0000-0000-000000000001', name: 'Room 101', type: 'classroom', capacity: 60 },
      { id: '50000000-0000-0000-0000-000000000002', name: 'Room 102', type: 'classroom', capacity: 60 },
      { id: '50000000-0000-0000-0000-000000000003', name: 'Room 103', type: 'classroom', capacity: 60 },
      { id: '50000000-0000-0000-0000-000000000004', name: 'Room 104', type: 'classroom', capacity: 60 },
      { id: '50000000-0000-0000-0000-000000000005', name: 'Lab 1', type: 'lab', capacity: 30 },
      { id: '50000000-0000-0000-0000-000000000006', name: 'Lab 2', type: 'lab', capacity: 30 },
    ];

    const d = new Date(input.date);
    const dayOfWeek = d.getUTCDay() === 0 ? 7 : d.getUTCDay();
    const day = dayOfWeek >= 1 && dayOfWeek <= 5 ? dayOfWeek : 5;

    const timetableForDay = activeTimetable.filter((r) => r.day === day);

    const rooms = demoRoomsList.map((rm) => {
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

        // Check if there is an active open slot for this timetable row on this date
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
            const extra = activeExtraLectures.find((el) => el.open_slot_id === openSlot.id);
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
    // If openSlotId provided, find the open slot
    const slot = activeOpenSlots.find((s) => s.id === input.openSlotId);
    
    // Provide ranked candidates
    const recs: Recommendation[] = [
      {
        facultyId: '20000000-0000-0000-0000-000000000002',
        facultyName: 'Prof. Kaur',
        score: 95,
        reasons: [
          'Assigned to class curriculum (Operating Systems)',
          '100% free at requested period (No scheduling conflict)',
          'Within statutory workload bounds (20 hrs / 24 max)',
        ],
      },
      {
        facultyId: '20000000-0000-0000-0000-000000000003',
        facultyName: 'Dr. Mehta',
        score: 82,
        reasons: [
          'Assigned to department curriculum (Computer Organization)',
          'Free during period',
          'Sufficient weekly workload balance',
        ],
      },
      {
        facultyId: '20000000-0000-0000-0000-000000000004',
        facultyName: 'Dr. Verma',
        score: 68,
        reasons: [
          'Department peer faculty',
          'Free slot available',
          'Acceptable substitution profile',
        ],
      },
    ];

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
    const existing = activeFacultyList.find((f) => f.id === id);
    const profile: FacultyView = {
      id,
      user_id: input.user_id || existing?.user_id || `10000000-0000-0000-0000-${String(activeFacultyList.length + 1).padStart(12, '0')}`,
      name: existing?.name || 'Faculty Member',
      email: existing?.email || 'faculty@schednexa.edu',
      department: input.department,
      required_hours: input.required_hours,
      max_hours: input.max_hours,
    };
    if (existing) {
      Object.assign(existing, profile);
    } else {
      activeFacultyList.push(profile);
    }
    return { ok: true, data: profile };
  },

  upsertSubject: async (input) => {
    const id = input.id || `30000000-0000-0000-0000-${String(activeSubjectsList.length + 1).padStart(12, '0')}`;
    const subject: Subject = {
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
      Object.assign(existing, subject);
    } else {
      activeSubjectsList.push(subject);
    }
    return { ok: true, data: subject };
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

    // Determine target slot number
    const slotDef = TIME_SLOT_DEFS.find(
      (ts) => `a0000000-0000-0000-0000-${String(ts.slotNo).padStart(12, '0')}` === input.slotId
    );
    const targetSlotNo = slotDef ? slotDef.slotNo : 1;
    const targetRoomId = input.roomId || entry.roomId;

    const conflicts: string[] = [];

    // Check Room Collision
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

    // Check Faculty Collision
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

    // Check Class Collision
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

    // Apply move
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

    // Also push a notification
    activeNotifications.unshift({
      id: `notif-0000-0000-0000-${String(activeNotifications.length + 1).padStart(12, '0')}`,
      user_id: input.facultyId,
      title: 'Lab Booking Approved',
      message: `Your booking for ${input.roomId.includes('6') ? 'Lab 2' : 'Lab 1'} on ${input.date} has been confirmed.`,
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
      lectures: 100,
      conflicts: 0,
      roomUtilizationPct: 82,
      openSlotsFilled: 4,
      hoursSaved: 4,
    };
    return { ok: true, data: stats };
  },

  getAnalytics: async () => {
    return {
      ok: true,
      data: {
        peakHoursHeatmap: [
          { day: 'Mon', s1: 65, s2: 90, s3: 100, s4: 85, s5: 95, s6: 70, s7: 35 },
          { day: 'Tue', s1: 75, s2: 95, s3: 100, s4: 90, s5: 85, s6: 80, s7: 40 },
          { day: 'Wed', s1: 80, s2: 100, s3: 95, s4: 80, s5: 90, s6: 75, s7: 30 },
          { day: 'Thu', s1: 70, s2: 85, s3: 100, s4: 95, s5: 100, s6: 85, s7: 45 },
          { day: 'Fri', s1: 60, s2: 80, s3: 90, s4: 75, s5: 80, s6: 60, s7: 25 },
        ],
        hoursSavedTimeline: [
          { date: 'Oct 04', daily: 2, cumulative: 2 },
          { date: 'Oct 05', daily: 4, cumulative: 6 },
          { date: 'Oct 06', daily: 5, cumulative: 11 },
          { date: 'Oct 07', daily: 3, cumulative: 14 },
          { date: 'Oct 08', daily: 6, cumulative: 20 },
          { date: 'Oct 09', daily: 4, cumulative: 24 },
          { date: 'Oct 10', daily: 5, cumulative: 29 },
        ],
        openSlotsRatio: [
          { name: 'Claimed & Rescued', value: 24, fill: '#4F46E5' },
          { name: 'Active / Available', value: 4, fill: '#F59E0B' },
          { name: 'Unclaimed / Passed', value: 2, fill: '#EF4444' },
        ],
        weeklyTrends: [
          { week: 'W1 (Sep 15)', created: 8, rescued: 7, lost: 1 },
          { week: 'W2 (Sep 22)', created: 10, rescued: 9, lost: 1 },
          { week: 'W3 (Sep 29)', created: 6, rescued: 6, lost: 0 },
          { week: 'W4 (Oct 06)', created: 9, rescued: 8, lost: 1 },
        ],
        facultyRescues: [
          { name: 'Prof. Kaur', department: 'Computer Science', hours: 8, efficiency: 96 },
          { name: 'Dr. Sharma', department: 'Computer Science', hours: 7, efficiency: 94 },
          { name: 'Dr. Mehta', department: 'Computer Science', hours: 5, efficiency: 90 },
          { name: 'Dr. Verma', department: 'Information Tech', hours: 4, efficiency: 88 },
          { name: 'Dr. Iyer', department: 'Computer Science', hours: 3, efficiency: 85 },
        ],
        roomEfficiency: [
          { name: 'LH-101', type: 'Classroom', capacity: 70, utilization: 92 },
          { name: 'LH-102', type: 'Classroom', capacity: 60, utilization: 88 },
          { name: 'CS-Lab-1', type: 'Lab', capacity: 35, utilization: 84 },
          { name: 'CS-Lab-2', type: 'Lab', capacity: 35, utilization: 78 },
          { name: 'IT-Lab-1', type: 'Lab', capacity: 30, utilization: 72 },
        ],
      },
    };
  },
};
