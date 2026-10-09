import type {
  TimetableEntry,
  SubjectType,
  FacultyView,
  Subject,
  Class,
  Room,
  DemoUser,
} from '@shared/types';
import rawSeedData from './seed-data.json';

export const TIME_SLOT_DEFS = [
  { slotNo: 1, startTime: '09:00', endTime: '09:50' },
  { slotNo: 2, startTime: '09:50', endTime: '10:40' },
  { slotNo: 3, startTime: '10:40', endTime: '11:30' },
  { slotNo: 4, startTime: '11:30', endTime: '12:20' },
  { slotNo: 5, startTime: '12:20', endTime: '13:10' },
  { slotNo: 6, startTime: '14:00', endTime: '14:50' },
  { slotNo: 7, startTime: '14:50', endTime: '15:40' },
];

export const DAYS = [
  { day: 1, name: 'Monday', short: 'Mon' },
  { day: 2, name: 'Tuesday', short: 'Tue' },
  { day: 3, name: 'Wednesday', short: 'Wed' },
  { day: 4, name: 'Thursday', short: 'Thu' },
  { day: 5, name: 'Friday', short: 'Fri' },
];

export const SEED_CLASSES: Class[] = rawSeedData.classes as Class[];
export const SEED_ROOMS: Room[] = rawSeedData.rooms as Room[];
export const SEED_SUBJECTS: Subject[] = rawSeedData.subjects as Subject[];
export const SEED_FACULTY: FacultyView[] = rawSeedData.facultyProfiles.map((f: any) => ({
  id: f.id,
  user_id: f.user_id,
  name: f.name,
  email: `${f.code.toLowerCase().replace(/[^a-z0-9]/g, '')}@schednexa.edu`,
  department: f.department,
  required_hours: f.required_hours,
  max_hours: f.max_hours,
}));

export const SEED_USERS: DemoUser[] = [
  { id: '10000000-0000-0000-0000-000000000001', name: 'Administrator', role: 'admin' },
  ...SEED_FACULTY.map((f) => ({
    id: f.user_id,
    name: f.name,
    role: 'faculty' as const,
    facultyId: f.id,
  })),
];

export const SEED_FACULTY_SUBJECTS = rawSeedData.facultySubjects as Array<{ faculty_id: string; subject_id: string }>;

export function buildDemoTimetable(): TimetableEntry[] {
  const subjectsMap = new Map<string, any>();
  SEED_SUBJECTS.forEach((s) => subjectsMap.set(s.id, s));

  return rawSeedData.timetable.map((t: any) => {
    const slotDef = TIME_SLOT_DEFS.find((sd) => sd.slotNo === t.slot_no) || TIME_SLOT_DEFS[0];
    const sub = subjectsMap.get(t.subject_id);
    const subType: SubjectType =
      (sub?.type as SubjectType) ||
      (t.subject_name.toLowerCase().includes('lab') ? 'lab' : 'theory');

    return {
      id: t.id,
      day: t.day,
      slotId: t.slot_id,
      slotNo: t.slot_no,
      startTime: slotDef.startTime,
      endTime: slotDef.endTime,
      classId: t.class_id,
      className: t.class_name,
      subjectId: t.subject_id,
      subjectName: t.subject_name,
      subjectType: subType,
      facultyId: t.faculty_id,
      facultyName: t.faculty_name,
      roomId: t.room_id,
      roomName: t.room_name,
      blockId: t.block_id,
    };
  });
}
