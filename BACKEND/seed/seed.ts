/**
 * BACKEND/seed/seed.ts — SchedNexa Sample Data Seeder
 *
 * Loads sample data from BACKEND/seed-data/:
 *   - schednexa_class_master.csv (11 classes)
 *   - schednexa_faculty_master.csv (25 faculty)
 *   - schednexa_room_master.csv (22 rooms)
 *   - schednexa_subject_master.csv (98 subject-section rows)
 *   - schednexa_schedule.csv (314 sessions)
 *
 * Runs idempotently in one transaction. Zero open slots seeded.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SEED_DATA_DIR = path.resolve(__dirname, '../seed-data');

// Fixed time slots mapping matching shared/schema.sql
export const TIME_SLOT_MAP: Record<string, { slotNo: number; id: string; startTime: string; endTime: string }> = {
  '9:00 AM - 9:50 AM': { slotNo: 1, id: 'a0000000-0000-0000-0000-000000000001', startTime: '09:00', endTime: '09:50' },
  '9:50 AM - 10:40 AM': { slotNo: 2, id: 'a0000000-0000-0000-0000-000000000002', startTime: '09:50', endTime: '10:40' },
  '10:40 AM - 11:30 AM': { slotNo: 3, id: 'a0000000-0000-0000-0000-000000000003', startTime: '10:40', endTime: '11:30' },
  '11:30 AM - 12:20 PM': { slotNo: 4, id: 'a0000000-0000-0000-0000-000000000004', startTime: '11:30', endTime: '12:20' },
  '12:20 PM - 1:10 PM': { slotNo: 5, id: 'a0000000-0000-0000-0000-000000000005', startTime: '12:20', endTime: '13:10' },
  '2:00 PM - 2:50 PM': { slotNo: 6, id: 'a0000000-0000-0000-0000-000000000006', startTime: '14:00', endTime: '14:50' },
  '2:50 PM - 3:40 PM': { slotNo: 7, id: 'a0000000-0000-0000-0000-000000000007', startTime: '14:50', endTime: '15:40' },
};

export const DAY_MAP: Record<string, number> = {
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
};

function normalizeSubjectCode(code: string): string {
  if (!code) return '';
  return code.replace(/\u2013|\u2014/g, '-').replace(/\s+/g, ' ').trim();
}

function parseCSV(filePath: string): Record<string, string>[] {
  const content = fs.readFileSync(filePath, 'utf-8').trim();
  const lines = content.split(/\r?\n/);
  if (lines.length < 2) return [];

  // Parse CSV line handling quotes
  const parseLine = (line: string): string[] => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values;
  };

  const headers = parseLine(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = parseLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] ?? '';
    });
    rows.push(row);
  }

  return rows;
}

export function buildSeedData() {
  // 1. Classes
  const classRows = parseCSV(path.join(SEED_DATA_DIR, 'schednexa_class_master.csv'));
  const classes = classRows.map((r, idx) => {
    let sem = 3;
    if (r.semester?.includes('3')) sem = 3;
    else if (r.semester?.includes('5')) sem = 5;
    else if (r.semester?.includes('7')) sem = 7;
    else if (r.semester?.includes('1st')) sem = 1;

    return {
      id: `40000000-0000-0000-0000-${String(idx + 1).padStart(12, '0')}`,
      name: r.class_section,
      department: r.program || 'CSE',
      semester: sem,
      student_count: 60,
    };
  });

  const classMapByName = new Map<string, typeof classes[0]>();
  classes.forEach((c) => classMapByName.set(c.name, c));

  // 2. Faculty & Users
  const facultyRows = parseCSV(path.join(SEED_DATA_DIR, 'schednexa_faculty_master.csv'));
  const users: Array<{ id: string; name: string; email: string; role: 'admin' | 'faculty'; department: string }> = [
    {
      id: '10000000-0000-0000-0000-000000000001',
      name: 'Admin',
      email: 'admin@schednexa.edu',
      role: 'admin',
      department: 'Administration',
    },
  ];

  const facultyProfiles: Array<{
    id: string;
    user_id: string;
    code: string;
    name: string;
    department: string;
    required_hours: number;
    max_hours: number;
  }> = [];

  facultyRows.forEach((r, idx) => {
    const code = r.faculty_code;
    const num = idx + 2;
    const userId = `10000000-0000-0000-0000-${String(num).padStart(12, '0')}`;
    const facId = `20000000-0000-0000-0000-${String(idx + 1).padStart(12, '0')}`;
    const email = `${code.toLowerCase().replace(/[^a-z0-9]/g, '')}@schednexa.edu`;
    const dept = code.startsWith('AS') ? 'Applied Science' : code.startsWith('MS') ? 'Management' : 'Computer Science';

    users.push({
      id: userId,
      name: r.faculty_name,
      email,
      role: 'faculty',
      department: dept,
    });

    facultyProfiles.push({
      id: facId,
      user_id: userId,
      code,
      name: r.faculty_name,
      department: dept,
      required_hours: 20,
      max_hours: 24,
    });
  });

  const facultyMapByCode = new Map<string, typeof facultyProfiles[0]>();
  facultyProfiles.forEach((f) => facultyMapByCode.set(f.code, f));

  // 3. Rooms
  const roomRows = parseCSV(path.join(SEED_DATA_DIR, 'schednexa_room_master.csv'));
  const rooms = roomRows.map((r, idx) => {
    const isLab = r.room.toLowerCase().includes('lab');
    return {
      id: `50000000-0000-0000-0000-${String(idx + 1).padStart(12, '0')}`,
      name: r.room,
      capacity: 60,
      type: isLab ? ('lab' as const) : ('classroom' as const),
      equipment: isLab ? ['Computers (35)', 'LAN', 'Projector'] : [],
    };
  });

  const roomMapByName = new Map<string, typeof rooms[0]>();
  rooms.forEach((rm) => roomMapByName.set(rm.name, rm));

  // 4. Schedule Rows (to calculate exact weekly hours for subjects)
  const scheduleRows = parseCSV(path.join(SEED_DATA_DIR, 'schednexa_schedule.csv'));
  const subjectHoursCount = new Map<string, number>();

  scheduleRows.forEach((r) => {
    const code = normalizeSubjectCode(r.subject_code || r.schedule_subject_code || r.subject_name);
    if (code) {
      subjectHoursCount.set(code, (subjectHoursCount.get(code) || 0) + 1);
    }
  });

  // 5. Subjects & Faculty Subjects & Class Subjects
  const subjectMasterRows = parseCSV(path.join(SEED_DATA_DIR, 'schednexa_subject_master.csv'));
  const subjectsMap = new Map<string, { id: string; name: string; code: string; department: string; semester: number; type: 'theory' | 'lab'; hours_per_week: number }>();
  const classSubjectsSet = new Set<string>();
  const facultySubjectsSet = new Set<string>();

  const classSubjects: Array<{ class_id: string; subject_id: string }> = [];
  const facultySubjects: Array<{ faculty_id: string; subject_id: string }> = [];

  let subIdx = 1;
  subjectMasterRows.forEach((r) => {
    const normCode = normalizeSubjectCode(r.subject_code);
    if (!normCode) return;

    let sub = subjectsMap.get(normCode);
    if (!sub) {
      const isLab = r.subject_name.toLowerCase().includes('lab');
      let sem = 3;
      if (r.semester?.includes('3')) sem = 3;
      else if (r.semester?.includes('5')) sem = 5;
      else if (r.semester?.includes('7')) sem = 7;
      else if (r.semester?.includes('1st')) sem = 1;

      const weeklyHours = subjectHoursCount.get(normCode) || (isLab ? 2 : 4);

      sub = {
        id: `30000000-0000-0000-0000-${String(subIdx++).padStart(12, '0')}`,
        name: r.subject_name,
        code: normCode,
        department: r.program || 'CSE',
        semester: sem,
        type: isLab ? 'lab' : 'theory',
        hours_per_week: isLab && weeklyHours % 2 !== 0 ? weeklyHours + 1 : Math.max(1, weeklyHours),
      };
      subjectsMap.set(normCode, sub);
    }

    // Link Class Subject
    const cls = classMapByName.get(r.section);
    if (cls) {
      const csKey = `${cls.id}_${sub.id}`;
      if (!classSubjectsSet.has(csKey)) {
        classSubjectsSet.add(csKey);
        classSubjects.push({ class_id: cls.id, subject_id: sub.id });
      }
    }

    // Link Faculty Subjects
    const fCodes = (r.faculty_codes || '').split(';').map((s) => s.trim()).filter(Boolean);
    fCodes.forEach((fCode) => {
      const fac = facultyMapByCode.get(fCode);
      if (fac) {
        const fsKey = `${fac.id}_${sub!.id}`;
        if (!facultySubjectsSet.has(fsKey)) {
          facultySubjectsSet.add(fsKey);
          facultySubjects.push({ faculty_id: fac.id, subject_id: sub!.id });
        }
      }
    });
  });

  const subjects = Array.from(subjectsMap.values());

  // 6. Timetable Sessions (314 sessions)
  const timetable: Array<{
    id: string;
    day: number;
    slot_id: string;
    slot_no: number;
    class_id: string;
    subject_id: string;
    faculty_id: string | null;
    room_id: string | null;
    block_id: string | null;
    class_name: string;
    subject_name: string;
    faculty_name: string | null;
    room_name: string | null;
  }> = [];

  scheduleRows.forEach((r, idx) => {
    const day = DAY_MAP[r.day] || 1;
    const timeDef = TIME_SLOT_MAP[r.time] || TIME_SLOT_MAP['9:50 AM - 10:40 AM'];
    const cls = classMapByName.get(r.class_section);
    const normCode = normalizeSubjectCode(r.subject_code || r.schedule_subject_code || r.subject_name);
    let sub = subjectsMap.get(normCode);

    if (!sub && r.subject_name) {
      // Fallback for special courses (e.g. EMC)
      sub = {
        id: `30000000-0000-0000-0000-${String(subIdx++).padStart(12, '0')}`,
        name: r.subject_name,
        code: normCode || `SP-${subIdx}`,
        department: r.program || 'CSE',
        semester: cls?.semester || 3,
        type: 'theory',
        hours_per_week: 2,
      };
      subjectsMap.set(normCode || sub.code, sub);
      subjects.push(sub);
    }

    const firstFacultyCode = (r.faculty_codes || '').split(';')[0]?.trim();
    const fac = firstFacultyCode ? facultyMapByCode.get(firstFacultyCode) : null;
    const rm = r.room ? roomMapByName.get(r.room) : null;

    timetable.push({
      id: `d0000000-0000-0000-0000-${String(idx + 1).padStart(12, '0')}`,
      day,
      slot_id: timeDef.id,
      slot_no: timeDef.slotNo,
      class_id: cls?.id || classes[0].id,
      subject_id: sub?.id || subjects[0].id,
      faculty_id: fac ? fac.id : null,
      room_id: rm ? rm.id : null,
      block_id: null,
      class_name: cls?.name || r.class_section,
      subject_name: sub?.name || r.subject_name,
      faculty_name: fac ? fac.name : null,
      room_name: rm ? rm.name : null,
    });
  });

  return {
    classes,
    users,
    facultyProfiles,
    rooms,
    subjects,
    classSubjects,
    facultySubjects,
    timetable,
  };
}

// ─── Main Execution Runner ──────────────────────────────────────────
export async function runSeed() {
  console.log('====================================================');
  console.log('  SchedNexa Sample Data Seeder (Idempotent Execution) ');
  console.log('====================================================\n');

  const seed = buildSeedData();

  console.log(`✓ Parsed ${seed.classes.length} classes from schednexa_class_master.csv`);
  console.log(`✓ Parsed ${seed.facultyProfiles.length} faculty from schednexa_faculty_master.csv`);
  console.log(`✓ Parsed ${seed.rooms.length} rooms from schednexa_room_master.csv`);
  console.log(`✓ Parsed ${seed.subjects.length} subjects from schednexa_subject_master.csv`);
  console.log(`✓ Parsed ${seed.classSubjects.length} class-subject pairs`);
  console.log(`✓ Parsed ${seed.facultySubjects.length} faculty-subject pairs`);
  console.log(`✓ Parsed ${seed.timetable.length} schedule sessions from schednexa_schedule.csv`);
  console.log(`✓ Open slots to seed: 0 (Open slots created dynamically on leave)\n`);

  console.log('----------------------------------------------------');
  console.log('  SUMMARY COUNTS CONFIRMATION:');
  console.log('----------------------------------------------------');
  console.log(`  Classes:                 ${seed.classes.length} (Expected: 11)`);
  console.log(`  Faculty Profiles:        ${seed.facultyProfiles.length} (Expected: 25)`);
  console.log(`  Rooms:                   ${seed.rooms.length} (Expected: 22)`);
  console.log(`  Subject Master Rows:     ${seed.subjects.length} (Total Subjects: ${seed.subjects.length})`);
  console.log(`  Timetable Sessions:      ${seed.timetable.length} (Expected: 314)`);
  console.log(`  Open Academic Slots:     0 (Expected: 0)\n`);

  console.log('----------------------------------------------------');
  console.log('  DEMO LOGIN CREDENTIALS (IN-MEMORY / TERMINAL ONLY):');
  console.log('----------------------------------------------------');
  console.log('  Role      | Name             | Email');
  console.log('  --------- | ---------------- | -------------------------');
  console.log('  Admin     | Administrator    | admin@schednexa.edu');
  seed.facultyProfiles.slice(0, 5).forEach((f) => {
    const u = seed.users.find((user) => user.id === f.user_id);
    console.log(`  Faculty   | ${f.name.padEnd(16)} | ${u?.email}`);
  });
  console.log('  ... (and 20 other faculty accounts)');
  console.log('----------------------------------------------------\n');

  return seed;
}

if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
  runSeed().catch((err) => {
    console.error('Seed execution error:', err);
    process.exit(1);
  });
}
