# DATABASE (PostgreSQL / Supabase) - LOCKED

- All ids are uuid, default gen_random_uuid().
- Columns are snake_case.
- 'faculty_id' everywhere means faculty_profiles.id, NOT users.id.
- No RLS.
- Enums are text with CHECK constraints.
- Realtime enabled on: notifications, open_slots, extra_lectures.
- SQL cannot fully enforce the lab-block pairing. The engine enforces it.
- Source of truth for DDL: shared/schema.sql. Demo data: shared/seed.sql.

## Tables

| Table | Columns |
|---|---|
| users | id (= auth user id), name, email (unique), role, department |
| faculty_profiles | id, user_id (FK users.id, unique), department, required_hours int, max_hours int (>= required_hours) |
| subjects | id, name, code (unique), department, semester int, type, hours_per_week int |
| classes | id, name (unique, e.g. CSE-3A), department, semester int, student_count int |
| class_subjects | class_id (FK), subject_id (FK), PK(class_id, subject_id). Weekly hours come from subjects.hours_per_week |
| faculty_subjects | faculty_id (FK faculty_profiles.id), subject_id (FK), PK(faculty_id, subject_id). Subjects a faculty may teach |
| rooms | id, name (unique, e.g. Room 101), capacity int, type, equipment text[] (empty for classrooms) |
| time_slots | id, slot_no int (unique), start_time time, end_time time |
| timetable | id, day (1-5), slot_id (FK), class_id (FK), subject_id (FK), faculty_id (FK), room_id (FK), block_id uuid nullable |
| leave_requests | id, faculty_id (FK), date, reason (nullable), status |
| open_slots | id, leave_request_id (FK), timetable_id (FK), date, slot_id (FK), end_slot_id (FK), class_id (FK), room_id (FK), original_faculty_id (FK), status |
| extra_lectures | id, open_slot_id (FK), faculty_id (FK), subject_id (FK), status, created_at |
| lab_bookings | id, room_id (FK), faculty_id (FK), date, slot_id (FK), end_slot_id (FK), purpose, equipment text[], status |
| notifications | id, user_id (FK users.id), title, message, type, related_id uuid nullable, read boolean default false, created_at |

## Constraints
### UNIQUE
- users.email; subjects.code; classes.name; rooms.name; time_slots.slot_no; faculty_profiles.user_id
- timetable: UNIQUE(day, slot_id, class_id), UNIQUE(day, slot_id, faculty_id), UNIQUE(day, slot_id, room_id)
- leave_requests: UNIQUE(faculty_id, date)
- open_slots: UNIQUE(timetable_id, date)

### Enums (CHECK)
- users.role: admin | faculty
- subjects.type: theory | lab
- rooms.type: classroom | lab
- leave_requests.status: approved
- open_slots.status: open | booked | cancelled
- extra_lectures.status: confirmed | cancelled
- lab_bookings.status: pending | approved | rejected
- notifications.type: open_slot | booking_confirmed | slot_taken | lab_booking

### Other CHECKs
- timetable.day between 1 and 5
- faculty_profiles.max_hours >= required_hours

## Table notes
- time_slots: seeded, never edited. 7 rows, see docs/PROJECT.md for times.
- timetable (weekly template): theory = 1 row, block_id NULL. Lab = 2 rows, same day, consecutive valid slots, same class/subject/faculty/room, SAME block_id. Never modified by leave or extra lectures. Only the generator and admin edit it. A lab block moves/deletes as a whole.
- open_slots.timetable_id points to the FIRST row of the lecture/lab block. slot_id = first slot. end_slot_id = last slot (= slot_id for theory).
- extra_lectures inherits the span of its open slot. Subject must be in faculty_subjects of that faculty. Subject type must match the open slot room type. Only one confirmed extra lecture per open slot.
- lab_bookings: always a valid lab block. equipment is a subset of rooms.equipment. room_id must be of type lab.
- Valid lab blocks (start slot_no, end slot_no): (1,2) (2,3) (3,4) (4,5) (6,7). (5,6) is INVALID.