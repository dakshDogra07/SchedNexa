// shared/types.ts  LOCKED
// Table types use snake_case fields exactly as in shared/schema.sql.
// API input/view types use camelCase as in SPEC section 8.
// 'faculty_id' / 'facultyId' always means faculty_profiles.id, NOT users.id.

// ---------- Result wrapper ----------
export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

// ---------- Enums ----------
export type UserRole = 'admin' | 'faculty';
export type SubjectType = 'theory' | 'lab';
export type RoomType = 'classroom' | 'lab';
export type LeaveStatus = 'approved';
export type OpenSlotStatus = 'open' | 'booked' | 'cancelled';
export type ExtraLectureStatus = 'confirmed' | 'cancelled';
export type LabBookingStatus = 'pending' | 'approved' | 'rejected';
export type NotificationType = 'open_slot' | 'booking_confirmed' | 'slot_taken' | 'lab_booking';
export type ScheduleState = 'normal' | 'open' | 'extra' | 'lab_booking';
export type WorkloadStatus = 'under' | 'ok' | 'over';
export type AvailabilityState = 'free' | 'busy' | 'open';

// ---------- Table types (match shared/schema.sql) ----------
export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string | null;
};

export type FacultyProfile = {
  id: string;
  user_id: string;
  department: string | null;
  required_hours: number;
  max_hours: number;
};

export type Subject = {
  id: string;
  name: string;
  code: string;
  department: string | null;
  semester: number;
  type: SubjectType;
  hours_per_week: number;
};

export type Class = {
  id: string;
  name: string;
  department: string | null;
  semester: number;
  student_count: number;
};

export type ClassSubject = {
  class_id: string;
  subject_id: string;
};

export type FacultySubject = {
  faculty_id: string;
  subject_id: string;
};

export type Room = {
  id: string;
  name: string;
  capacity: number;
  type: RoomType;
  equipment: string[];
};

export type TimeSlot = {
  id: string;
  slot_no: number;
  start_time: string; // 'HH:MM' or 'HH:MM:SS'
  end_time: string;
};

export type Timetable = {
  id: string;
  day: number; // 1=Mon .. 5=Fri
  slot_id: string;
  class_id: string;
  subject_id: string;
  faculty_id: string;
  room_id: string;
  block_id: string | null;
};

export type LeaveRequest = {
  id: string;
  faculty_id: string;
  date: string; // YYYY-MM-DD
  reason: string | null;
  status: LeaveStatus;
};

export type OpenSlot = {
  id: string;
  leave_request_id: string;
  timetable_id: string; // FIRST row of lecture/lab block
  date: string; // YYYY-MM-DD
  slot_id: string; // first slot
  end_slot_id: string; // last slot (= slot_id for theory)
  class_id: string;
  room_id: string;
  original_faculty_id: string;
  status: OpenSlotStatus;
};

export type ExtraLecture = {
  id: string;
  open_slot_id: string;
  faculty_id: string;
  subject_id: string;
  status: ExtraLectureStatus;
  created_at: string;
};

export type LabBooking = {
  id: string;
  room_id: string;
  faculty_id: string;
  date: string; // YYYY-MM-DD
  slot_id: string; // first slot
  end_slot_id: string; // second slot
  purpose: string;
  equipment: string[];
  status: LabBookingStatus;
};

export type Notification = {
  id: string;
  user_id: string; // users.id
  title: string;
  message: string;
  type: NotificationType;
  related_id: string | null;
  read: boolean;
  created_at: string;
};

// ---------- View / result types (camelCase) ----------
export type DemoUser = {
  id: string; // users.id
  name: string;
  role: UserRole;
  facultyId?: string; // faculty_profiles.id (faculty only)
};

export type UnscheduledLecture = {
  classId: string;
  subjectId: string;
  reason: string;
};

export type GenerationResult = {
  lecturesPlaced: number;
  conflicts: number;
  unscheduled: UnscheduledLecture[];
  facultyAtFullLoad: number;
};

export type TimetableEntry = {
  id: string; // timetable.id
  day: number;
  slotId: string;
  slotNo: number;
  startTime: string;
  endTime: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  subjectType: SubjectType;
  facultyId: string;
  facultyName: string;
  roomId: string;
  roomName: string;
  blockId: string | null;
};

export type ScheduleEntry = {
  date: string;
  day: number;
  slotId: string;
  slotNo: number;
  endSlotId: string; // = slotId for a 1-slot entry
  endSlotNo: number;
  startTime: string;
  endTime: string;
  span: number;
  state: ScheduleState;
  classId: string;
  className: string;
  roomId: string;
  roomName: string;
  subjectId: string | null; // null when state = 'open'
  subjectName: string | null;
  facultyId: string | null; // null when state = 'open'
  facultyName: string | null;
  timetableId: string | null;
  openSlotId: string | null;
  extraLectureId: string | null;
  labBookingId: string | null;
  blockId: string | null;
};

export type AffectedLecture = {
  timetableId: string; // FIRST row of lecture/lab block
  date: string;
  day: number;
  slotId: string;
  endSlotId: string;
  slotNo: number;
  endSlotNo: number;
  startTime: string;
  endTime: string;
  span: number;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  roomId: string;
  roomName: string;
};

export type OpenSlotView = {
  id: string;
  leaveRequestId: string;
  timetableId: string;
  date: string;
  slotId: string;
  endSlotId: string;
  slotNo: number;
  endSlotNo: number;
  startTime: string;
  endTime: string;
  span: number;
  classId: string;
  className: string;
  roomId: string;
  roomName: string;
  originalFacultyId: string;
  originalFacultyName: string;
  originalSubjectId: string;
  originalSubjectName: string;
  status: OpenSlotStatus;
  score: number | null; // set only when getOpenSlots input has facultyId
};

export type Check = {
  key: string;
  label: string;
  passed: boolean;
  detail: string;
};

export type CheckResult = {
  ok: boolean; // true only if all 5 checks passed
  checks: Check[]; // exactly 5
};

export type WorkloadRow = {
  facultyId: string;
  facultyName: string;
  requiredHours: number;
  assignedHours: number;
  extraHours: number;
  totalHours: number;
  maxHours: number;
  status: WorkloadStatus;
};

export type RoomAvailabilitySlot = {
  slotId: string;
  slotNo: number;
  state: AvailabilityState;
  who: string | null; // faculty name / class name when busy or open
};

export type RoomAvailabilityRow = {
  roomId: string;
  roomName: string;
  roomType: RoomType;
  slots: RoomAvailabilitySlot[];
};

export type RoomAvailability = {
  date: string;
  rooms: RoomAvailabilityRow[];
};

export type Recommendation = {
  facultyId: string;
  facultyName: string;
  score: number;
  reasons: string[];
};

export type FacultyView = FacultyProfile & {
  name: string;
  email: string;
};

export type MoveResult = {
  ok: boolean;
  conflicts: string[];
};

export type DashboardStats = {
  lectures: number;
  conflicts: number;
  roomUtilizationPct: number;
  openSlotsFilled: number;
  hoursSaved: number;
};

export type AnalyticsData = Record<string, unknown[]>; // chart datasets keyed by name (P2)

// ---------- Upsert inputs (id absent = create, id present = update) ----------
export type UpsertFacultyInput = Omit<FacultyProfile, 'id'> & { id?: string };
export type UpsertSubjectInput = Omit<Subject, 'id'> & { id?: string };
export type UpsertClassInput = Omit<Class, 'id'> & { id?: string };
export type UpsertRoomInput = Omit<Room, 'id'> & { id?: string };

// ---------- API contract (exactly the functions in SPEC section 8) ----------
export type ApiContract = {
  ping: { input: Record<string, never>; output: { time: string } };
  getDemoUsers: { input: Record<string, never>; output: DemoUser[] };
  resetDemo: { input: Record<string, never>; output: { message: string } };
  generateTimetable: { input: Record<string, never>; output: GenerationResult };
  getTimetable: {
    input: { classId?: string; facultyId?: string; roomId?: string };
    output: TimetableEntry[];
  };
  getEffectiveSchedule: {
    input: { date: string; facultyId?: string; classId?: string };
    output: ScheduleEntry[];
  };
  getLeaveImpact: {
    input: { facultyId: string; dateFrom: string; dateTo: string };
    output: AffectedLecture[];
  };
  markLeave: {
    input: { facultyId: string; dateFrom: string; dateTo: string; reason?: string };
    output: OpenSlot[];
  };
  getOpenSlots: {
    input: { facultyId?: string; status?: OpenSlotStatus };
    output: OpenSlotView[];
  };
  checkConflicts: {
    input: { openSlotId: string; facultyId: string; subjectId: string };
    output: CheckResult;
  };
  bookSlot: {
    input: { openSlotId: string; facultyId: string; subjectId: string };
    output: ExtraLecture;
  };
  getNotifications: { input: { userId: string }; output: Notification[] };
  markNotificationRead: { input: { notificationId: string }; output: { done: true } };
  getWorkload: { input: { facultyId?: string }; output: WorkloadRow[] };
  getRoomAvailability: { input: { date: string }; output: RoomAvailability };
  getRecommendations: { input: { openSlotId: string }; output: Recommendation[] };
  listFaculty: { input: Record<string, never>; output: FacultyView[] };
  listSubjects: { input: Record<string, never>; output: Subject[] };
  listClasses: { input: Record<string, never>; output: Class[] };
  listRooms: { input: Record<string, never>; output: Room[] };
  upsertFaculty: { input: UpsertFacultyInput; output: FacultyProfile };
  upsertSubject: { input: UpsertSubjectInput; output: Subject };
  upsertClass: { input: UpsertClassInput; output: Class };
  upsertRoom: { input: UpsertRoomInput; output: Room };
  moveTimetableEntry: {
    input: { timetableId: string; day: number; slotId: string; roomId?: string };
    output: MoveResult;
  };
  createLabBooking: {
    input: {
      roomId: string;
      facultyId: string;
      date: string;
      slotId: string;
      purpose: string;
      equipment: string[];
    };
    output: LabBooking;
  };
  listLabBookings: { input: { facultyId?: string }; output: LabBooking[] };
  decideLabBooking: {
    input: { bookingId: string; status: LabBookingStatus };
    output: LabBooking;
  };
  getDashboardStats: { input: Record<string, never>; output: DashboardStats };
  getAnalytics: { input: Record<string, never>; output: AnalyticsData };
};

export type ApiFunctionName = keyof ApiContract;
export type ApiInput<K extends ApiFunctionName> = ApiContract[K]['input'];
export type ApiOutput<K extends ApiFunctionName> = ApiContract[K]['output'];