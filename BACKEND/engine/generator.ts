/**
 * engine/generator.ts — PURE greedy timetable generation algorithm.
 *
 * No DB calls. Takes input data structures, places lab blocks first,
 * then theory lectures, respecting all hard constraints:
 *   1. No double-booking of faculty, class, or room.
 *   2. Room capacity >= class student_count.
 *   3. Subject type matches room type (lab -> lab room, theory -> classroom).
 *   4. Faculty total hours <= max_hours.
 *   5. Faculty is qualified to teach subject (in faculty_subjects).
 *
 * Valid lab blocks (start slot_no, end slot_no): (1,2), (2,3), (3,4), (4,5), (6,7).
 * Slot pair (5,6) is INVALID (crosses lunch break).
 */

import type {
  Class,
  ClassSubject,
  FacultyProfile,
  FacultySubject,
  GenerationResult,
  Room,
  Subject,
  TimeSlot,
  Timetable,
  UnscheduledLecture,
} from '@shared/types';

export type GeneratorInput = {
  classes: Class[];
  subjects: Subject[];
  classSubjects: ClassSubject[];
  faculty: FacultyProfile[];
  facultySubjects: FacultySubject[];
  rooms: Room[];
  timeSlots: TimeSlot[];
};

export type GeneratedTimetableRow = Omit<Timetable, 'id'> & { id?: string };

export type GenerateTimetableOutput = {
  timetable: GeneratedTimetableRow[];
  result: GenerationResult;
};

// Valid lab block slot number pairs (50-min slots, 7 slots/day)
const VALID_LAB_BLOCK_SLOT_NOS: [number, number][] = [
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 5],
  [6, 7],
];

export function generateTimetableGreedy(input: GeneratorInput): GenerateTimetableOutput {
  const {
    classes,
    subjects,
    classSubjects,
    faculty,
    facultySubjects,
    rooms,
    timeSlots,
  } = input;

  // Maps for fast lookups
  const subjectMap = new Map<string, Subject>(subjects.map((s) => [s.id, s]));
  const classMap = new Map<string, Class>(classes.map((c) => [c.id, c]));
  const timeSlotNoMap = new Map<number, TimeSlot>(timeSlots.map((ts) => [ts.slot_no, ts]));

  // Track occupancy: key = `${day}_${slotId}_${entityId}`
  const occupiedFacultySlots = new Set<string>();
  const occupiedClassSlots = new Set<string>();
  const occupiedRoomSlots = new Set<string>();

  // Track faculty assigned workload hours
  const facultyAssignedHours = new Map<string, number>(
    faculty.map((f) => [f.id, 0])
  );

  const timetable: GeneratedTimetableRow[] = [];
  const unscheduled: UnscheduledLecture[] = [];

  const days = [1, 2, 3, 4, 5];
  const sortedTimeSlots = [...timeSlots].sort((a, b) => a.slot_no - b.slot_no);

  // Helper functions
  const isFacultyFree = (fId: string, day: number, slotId: string) =>
    !occupiedFacultySlots.has(`${day}_${slotId}_${fId}`);

  const isClassFree = (cId: string, day: number, slotId: string) =>
    !occupiedClassSlots.has(`${day}_${slotId}_${cId}`);

  const isRoomFree = (rId: string, day: number, slotId: string) =>
    !occupiedRoomSlots.has(`${day}_${slotId}_${rId}`);

  const bookSlot = (
    day: number,
    slotId: string,
    cId: string,
    sId: string,
    fId: string,
    rId: string,
    blockId: string | null
  ) => {
    occupiedFacultySlots.add(`${day}_${slotId}_${fId}`);
    occupiedClassSlots.add(`${day}_${slotId}_${cId}`);
    occupiedRoomSlots.add(`${day}_${slotId}_${rId}`);
    timetable.push({
      day,
      slot_id: slotId,
      class_id: cId,
      subject_id: sId,
      faculty_id: fId,
      room_id: rId,
      block_id: blockId,
    });
  };

  // Separate classSubjects into Lab and Theory
  const labRequirements: { classId: string; subject: Subject; classObj: Class }[] = [];
  const theoryRequirements: { classId: string; subject: Subject; classObj: Class }[] = [];

  for (const cs of classSubjects) {
    const subjectObj = subjectMap.get(cs.subject_id);
    const classObj = classMap.get(cs.class_id);
    if (!subjectObj || !classObj) continue;

    if (subjectObj.type === 'lab') {
      labRequirements.push({ classId: cs.class_id, subject: subjectObj, classObj });
    } else {
      theoryRequirements.push({ classId: cs.class_id, subject: subjectObj, classObj });
    }
  }

  // ───────────────────────────────────────────────────────────────────
  // PHASE 1: LAB SUBJECTS FIRST (2-slot consecutive blocks)
  // ───────────────────────────────────────────────────────────────────
  for (const req of labRequirements) {
    const { classId, subject, classObj } = req;
    // Sessions per week for lab = hours_per_week / 2
    const sessions = Math.floor(subject.hours_per_week / 2);

    // Eligible faculty for this subject
    const eligibleFacultyIds = facultySubjects
      .filter((fs) => fs.subject_id === subject.id)
      .map((fs) => fs.faculty_id);
    const eligibleFaculty = faculty.filter((f) => eligibleFacultyIds.includes(f.id));

    // Eligible rooms for this lab (must be type 'lab' and capacity >= student_count)
    const eligibleRooms = rooms.filter(
      (r) => r.type === 'lab' && r.capacity >= classObj.student_count
    );

    for (let session = 0; session < sessions; session++) {
      let placed = false;

      dayLoop: for (const day of days) {
        for (const [sNo1, sNo2] of VALID_LAB_BLOCK_SLOT_NOS) {
          const ts1 = timeSlotNoMap.get(sNo1);
          const ts2 = timeSlotNoMap.get(sNo2);
          if (!ts1 || !ts2) continue;

          for (const f of eligibleFaculty) {
            const currentHours = facultyAssignedHours.get(f.id) || 0;
            if (currentHours + 2 > f.max_hours) continue;

            if (
              !isFacultyFree(f.id, day, ts1.id) ||
              !isFacultyFree(f.id, day, ts2.id)
            )
              continue;

            if (
              !isClassFree(classId, day, ts1.id) ||
              !isClassFree(classId, day, ts2.id)
            )
              continue;

            for (const r of eligibleRooms) {
              if (
                !isRoomFree(r.id, day, ts1.id) ||
                !isRoomFree(r.id, day, ts2.id)
              )
                continue;

              // Found valid slot! Book both slots of the lab block
              const blockId = crypto.randomUUID();
              bookSlot(day, ts1.id, classId, subject.id, f.id, r.id, blockId);
              bookSlot(day, ts2.id, classId, subject.id, f.id, r.id, blockId);

              facultyAssignedHours.set(f.id, currentHours + 2);
              placed = true;
              break dayLoop;
            }
          }
        }
      }

      if (!placed) {
        unscheduled.push({
          classId,
          subjectId: subject.id,
          reason: `No available lab block (faculty/room/slot conflict for ${classObj.name} - ${subject.name})`,
        });
      }
    }
  }

  // ───────────────────────────────────────────────────────────────────
  // PHASE 2: THEORY SUBJECTS (1-slot lectures)
  // ───────────────────────────────────────────────────────────────────
  for (const req of theoryRequirements) {
    const { classId, subject, classObj } = req;
    const sessions = subject.hours_per_week; // 1 slot per hour

    const eligibleFacultyIds = facultySubjects
      .filter((fs) => fs.subject_id === subject.id)
      .map((fs) => fs.faculty_id);
    const eligibleFaculty = faculty.filter((f) => eligibleFacultyIds.includes(f.id));

    const eligibleRooms = rooms.filter(
      (r) => r.type === 'classroom' && r.capacity >= classObj.student_count
    );

    for (let session = 0; session < sessions; session++) {
      let placed = false;

      dayLoop: for (const day of days) {
        for (const ts of sortedTimeSlots) {
          for (const f of eligibleFaculty) {
            const currentHours = facultyAssignedHours.get(f.id) || 0;
            if (currentHours + 1 > f.max_hours) continue;

            if (!isFacultyFree(f.id, day, ts.id)) continue;
            if (!isClassFree(classId, day, ts.id)) continue;

            for (const r of eligibleRooms) {
              if (!isRoomFree(r.id, day, ts.id)) continue;

              // Found valid single slot! Book it
              bookSlot(day, ts.id, classId, subject.id, f.id, r.id, null);

              facultyAssignedHours.set(f.id, currentHours + 1);
              placed = true;
              break dayLoop;
            }
          }
        }
      }

      if (!placed) {
        unscheduled.push({
          classId,
          subjectId: subject.id,
          reason: `No available classroom slot (faculty/room/slot conflict for ${classObj.name} - ${subject.name})`,
        });
      }
    }
  }

  // Calculate full load faculty
  let facultyAtFullLoad = 0;
  for (const f of faculty) {
    const assigned = facultyAssignedHours.get(f.id) || 0;
    if (assigned >= f.required_hours) {
      facultyAtFullLoad++;
    }
  }

  const result: GenerationResult = {
    lecturesPlaced: timetable.length,
    conflicts: 0, // Greedy placement guarantees 0 hard conflicts in the placed set
    unscheduled,
    facultyAtFullLoad,
  };

  return { timetable, result };
}
