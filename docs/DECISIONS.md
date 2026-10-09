# DECISIONS

Proposals for changes to LOCKED files (shared/, docs/API_CONTRACT.md, docs/DATABASE.md). Write a proposal here and stop. The human decides.

## Proposal format

### D-001 | <short title> | status: proposed | accepted | rejected
- Author: <frontend | backend>
- Task: <task ID>
- Locked file affected: <path>
- Problem: <what blocks the task>
- Proposed change: <exact change>
- Impact: <who must update what>
- Decision (human): <blank until decided>

## Example

### D-000 | Example: add index on timetable.faculty_id | status: proposed
- Author: backend
- Task: B-10
- Locked file affected: shared/schema.sql
- Problem: getWorkload is slow on large timetables.
- Proposed change: CREATE INDEX timetable_faculty_id_idx ON timetable (faculty_id);
- Impact: backend re-runs schema.sql on a fresh database. No type changes.
- Decision (human):

## Log

### D-001 | Co-taught Sessions Multi-Faculty Mapping | status: accepted
- Author: backend / seeder
- Task: PART B SEEDING
- Locked file affected: shared/schema.sql (timetable table)
- Problem: 24 schedule sessions feature co-teaching with multiple semicolon-separated faculty codes (e.g. "CS-TD ; CS-SG"), while `timetable.faculty_id` supports a single UUID foreign key.
- Resolution: Set the primary (first listed) instructor as `timetable.faculty_id`, and linked all co-instructors in the `faculty_subjects` join table.
- Impact: Co-teachers remain curriculum-linked; single-instructor slot assignment remains valid for locked schema.

### D-002 | Parallel Lab Subgroup (G1/G2) Overlaps | status: accepted
- Author: backend / seeder
- Task: PART B SEEDING
- Locked file affected: shared/schema.sql (timetable constraints)
- Problem: 52 sessions represent parallel sub-group batches (G1 / G2) occurring at identical class, day, and time slots.
- Resolution: Preserved all 314 schedule entries without dropping parallel group rows. No unique composite constraint enforced on `(class_id, day, slot_no)`.
- Impact: 100% data fidelity maintained across all 314 master schedule sessions.

### D-003 | Subject Code Unicode Normalization | status: accepted
- Author: backend / seeder
- Task: PART B SEEDING
- Locked file affected: shared/schema.sql (subjects table)
- Problem: Subject master CSV contained en-dash characters (`AGCS–25301`, Unicode U+2013) differing from lookup keys in schedules.
- Resolution: Normalized all en-dashes to standard ASCII hyphens (`AGCS-25301`) across all tables.
- Impact: Flawless join queries between schedule and subjects.

### D-004 | Distinct Faculty Records and Zero-Session Inclusion | status: accepted
- Author: backend / seeder
- Task: PART B SEEDING
- Locked file affected: shared/schema.sql (faculty_profiles, users)
- Problem: Two distinct faculty members share the name "Shagun Arora" (`CS-SA` and `CS-SK`), and 3 faculty (`MS-AR`, `AS-RT`, `CS-SK`) have 0 scheduled sessions.
- Resolution: Maintained separate profiles and logins for `CS-SA` and `CS-SK`, and seeded all 25 faculty profiles.
- Impact: Complete 25 faculty representation in workload and authentication systems.