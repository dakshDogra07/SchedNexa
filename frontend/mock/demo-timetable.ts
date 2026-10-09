import type {
  TimetableEntry,
  ScheduleEntry,
  SubjectType,
} from '@shared/types';

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

const CLASSES: Record<number, { id: string; name: string }> = {
  1: { id: '40000000-0000-0000-0000-000000000001', name: 'CSE-3A' },
  2: { id: '40000000-0000-0000-0000-000000000002', name: 'CSE-3B' },
  3: { id: '40000000-0000-0000-0000-000000000003', name: 'CSE-5A' },
  4: { id: '40000000-0000-0000-0000-000000000004', name: 'CSE-5B' },
};

const SUBJECTS: Record<number, { id: string; name: string; type: SubjectType }> = {
  1: { id: '30000000-0000-0000-0000-000000000001', name: 'DBMS', type: 'theory' },
  2: { id: '30000000-0000-0000-0000-000000000002', name: 'Data Structures', type: 'theory' },
  3: { id: '30000000-0000-0000-0000-000000000003', name: 'Discrete Mathematics', type: 'theory' },
  4: { id: '30000000-0000-0000-0000-000000000004', name: 'Computer Organization', type: 'theory' },
  5: { id: '30000000-0000-0000-0000-000000000005', name: 'DBMS Lab', type: 'lab' },
  6: { id: '30000000-0000-0000-0000-000000000006', name: 'Data Structures Lab', type: 'lab' },
  7: { id: '30000000-0000-0000-0000-000000000007', name: 'Operating Systems', type: 'theory' },
  8: { id: '30000000-0000-0000-0000-000000000008', name: 'Computer Networks', type: 'theory' },
  9: { id: '30000000-0000-0000-0000-000000000009', name: 'Software Engineering', type: 'theory' },
  10: { id: '30000000-0000-0000-0000-000000000010', name: 'Theory of Computation', type: 'theory' },
  11: { id: '30000000-0000-0000-0000-000000000011', name: 'Operating Systems Lab', type: 'lab' },
  12: { id: '30000000-0000-0000-0000-000000000012', name: 'Computer Networks Lab', type: 'lab' },
};

const FACULTY: Record<number, { id: string; name: string }> = {
  1: { id: '20000000-0000-0000-0000-000000000001', name: 'Dr. Sharma' },
  2: { id: '20000000-0000-0000-0000-000000000002', name: 'Prof. Kaur' },
  3: { id: '20000000-0000-0000-0000-000000000003', name: 'Dr. Mehta' },
  4: { id: '20000000-0000-0000-0000-000000000004', name: 'Dr. Verma' },
  5: { id: '20000000-0000-0000-0000-000000000005', name: 'Dr. Iyer' },
};

const ROOMS: Record<number, { id: string; name: string }> = {
  1: { id: '50000000-0000-0000-0000-000000000001', name: 'Room 101' },
  2: { id: '50000000-0000-0000-0000-000000000002', name: 'Room 102' },
  3: { id: '50000000-0000-0000-0000-000000000003', name: 'Room 103' },
  4: { id: '50000000-0000-0000-0000-000000000004', name: 'Room 104' },
  5: { id: '50000000-0000-0000-0000-000000000005', name: 'Lab 1' },
  6: { id: '50000000-0000-0000-0000-000000000006', name: 'Lab 2' },
};

// Raw tuple data from shared/seed.sql (n, day, slot_no, c, s, f, r, b)
const RAW_SEED_ROWS: Array<[number, number, number, number, number, number, number, number | null]> = [
  // Monday (day 1)
  [1,1,1,1,5,1,5,1],[2,1,2,1,5,1,5,1],[3,1,3,1,2,5,1,null],[4,1,4,1,4,3,1,null],[5,1,5,1,1,1,1,null],[6,1,6,1,3,1,1,null],
  [7,1,3,2,5,1,5,2],[8,1,4,2,5,1,5,2],[9,1,1,2,3,3,2,null],[10,1,2,2,2,5,2,null],[11,1,5,2,4,3,2,null],[12,1,7,2,1,1,2,null],
  [13,1,1,3,11,2,6,3],[14,1,2,3,11,2,6,3],[15,1,3,3,8,4,3,null],[16,1,4,3,10,5,3,null],[17,1,5,3,7,2,3,null],[18,1,6,3,9,2,3,null],
  [19,1,3,4,11,2,6,4],[20,1,4,4,11,2,6,4],[21,1,1,4,8,4,4,null],[22,1,2,4,9,4,4,null],[23,1,5,4,10,5,4,null],[24,1,7,4,7,2,4,null],
  // Tuesday (day 2)
  [25,2,3,1,6,3,5,5],[26,2,4,1,6,3,5,5],[27,2,1,1,2,5,1,null],[28,2,2,1,1,1,1,null],[29,2,5,1,4,3,1,null],[30,2,6,1,3,1,1,null],
  [31,2,1,2,6,3,5,6],[32,2,2,2,6,3,5,6],[33,2,3,2,2,5,2,null],[34,2,4,2,1,1,2,null],[35,2,6,2,3,3,2,null],[36,2,7,2,4,3,2,null],
  [37,2,3,3,12,4,6,7],[38,2,4,3,12,4,6,7],[39,2,1,3,7,2,3,null],[40,2,2,3,10,5,3,null],[41,2,5,3,8,4,3,null],[42,2,6,3,9,2,3,null],
  [43,2,1,4,12,4,6,8],[44,2,2,4,12,4,6,8],[45,2,3,4,7,2,4,null],[46,2,4,4,10,5,4,null],[47,2,6,4,8,4,4,null],[48,2,7,4,9,4,4,null],
  // Wednesday (day 3)
  [49,3,1,1,5,1,5,9],[50,3,2,1,5,1,5,9],[51,3,3,1,2,5,1,null],[52,3,4,1,4,3,1,null],[53,3,5,1,3,1,1,null],
  [54,3,3,2,5,1,5,10],[55,3,4,2,5,1,5,10],[56,3,1,2,2,5,2,null],[57,3,2,2,4,3,2,null],[58,3,6,2,1,1,2,null],
  [59,3,1,3,11,2,6,11],[60,3,2,3,11,2,6,11],[61,3,4,3,10,5,3,null],[62,3,5,3,7,2,3,null],[63,3,6,3,8,4,3,null],
  [64,3,3,4,11,2,6,12],[65,3,4,4,11,2,6,12],[66,3,2,4,10,5,4,null],[67,3,5,4,9,4,4,null],[68,3,6,4,7,2,4,null],
  // Thursday (day 4)
  [69,4,3,1,6,3,5,13],[70,4,4,1,6,3,5,13],[71,4,1,1,2,5,1,null],[72,4,2,1,1,1,1,null],[73,4,5,1,4,3,1,null],
  [74,4,1,2,6,3,5,14],[75,4,2,2,6,3,5,14],[76,4,3,2,2,5,2,null],[77,4,4,2,1,1,2,null],[78,4,6,2,3,3,2,null],
  [79,4,3,3,12,4,6,15],[80,4,4,3,12,4,6,15],[81,4,1,3,9,2,3,null],[82,4,2,3,10,5,3,null],[83,4,5,3,8,4,3,null],
  [84,4,1,4,12,4,6,16],[85,4,2,4,12,4,6,16],[86,4,3,4,7,2,4,null],[87,4,4,4,10,5,4,null],[88,4,6,4,8,4,4,null],
  // Friday (day 5) - row 90 is Sharma, DBMS, CSE-3A, Room 101, slot 2
  [89,5,1,1,2,5,1,null],[90,5,2,1,1,1,1,null],[91,5,4,1,3,1,1,null],
  [92,5,3,2,2,5,2,null],[93,5,5,2,3,3,2,null],[94,5,6,2,4,3,2,null],
  [95,5,1,3,7,2,3,null],[96,5,3,3,9,2,3,null],[97,5,5,3,10,5,3,null],
  [98,5,4,4,8,4,4,null],[99,5,6,4,10,5,4,null],[100,5,7,4,9,4,4,null],
];

export function buildDemoTimetable(): TimetableEntry[] {
  return RAW_SEED_ROWS.map(([n, day, slotNo, c, s, f, r, b]) => {
    const slotDef = TIME_SLOT_DEFS.find((ts) => ts.slotNo === slotNo)!;
    const cls = CLASSES[c];
    const subj = SUBJECTS[s];
    const fac = FACULTY[f];
    const rm = ROOMS[r];

    return {
      id: `d0000000-0000-0000-0000-${String(n).padStart(12, '0')}`,
      day,
      slotId: `a0000000-0000-0000-0000-${String(slotNo).padStart(12, '0')}`,
      slotNo,
      startTime: slotDef.startTime,
      endTime: slotDef.endTime,
      classId: cls.id,
      className: cls.name,
      subjectId: subj.id,
      subjectName: subj.name,
      subjectType: subj.type,
      facultyId: fac.id,
      facultyName: fac.name,
      roomId: rm.id,
      roomName: rm.name,
      blockId: b ? `b0000000-0000-0000-0000-${String(b).padStart(12, '0')}` : null,
    };
  });
}
