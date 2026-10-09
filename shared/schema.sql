-- shared/schema.sql  (PostgreSQL / Supabase)  LOCKED
-- No RLS. Enums are text + CHECK. 'faculty_id' = faculty_profiles.id.

CREATE TABLE users (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),  -- = auth user id
  name        text NOT NULL,
  email       text NOT NULL UNIQUE,
  role        text NOT NULL CHECK (role IN ('admin','faculty')),
  department  text
);

CREATE TABLE faculty_profiles (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  department      text,
  required_hours  int  NOT NULL,
  max_hours       int  NOT NULL,
  CONSTRAINT faculty_profiles_max_gte_required CHECK (max_hours >= required_hours)
);

CREATE TABLE subjects (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  code            text NOT NULL UNIQUE,
  department      text,
  semester        int  NOT NULL,
  type            text NOT NULL CHECK (type IN ('theory','lab')),
  hours_per_week  int  NOT NULL
);

CREATE TABLE classes (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text NOT NULL UNIQUE,
  department     text,
  semester       int  NOT NULL,
  student_count  int  NOT NULL
);

CREATE TABLE class_subjects (
  class_id    uuid NOT NULL REFERENCES classes(id)  ON DELETE CASCADE,
  subject_id  uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  PRIMARY KEY (class_id, subject_id)
);

CREATE TABLE faculty_subjects (
  faculty_id  uuid NOT NULL REFERENCES faculty_profiles(id) ON DELETE CASCADE,
  subject_id  uuid NOT NULL REFERENCES subjects(id)         ON DELETE CASCADE,
  PRIMARY KEY (faculty_id, subject_id)
);

CREATE TABLE rooms (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL UNIQUE,
  capacity   int  NOT NULL,
  type       text NOT NULL CHECK (type IN ('classroom','lab')),
  equipment  text[] NOT NULL DEFAULT '{}'
);

CREATE TABLE time_slots (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_no     int  NOT NULL UNIQUE,
  start_time  time NOT NULL,
  end_time    time NOT NULL
);

CREATE TABLE timetable (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day         int  NOT NULL CHECK (day BETWEEN 1 AND 5),
  slot_id     uuid NOT NULL REFERENCES time_slots(id),
  class_id    uuid NOT NULL REFERENCES classes(id),
  subject_id  uuid NOT NULL REFERENCES subjects(id),
  faculty_id  uuid NOT NULL REFERENCES faculty_profiles(id),
  room_id     uuid NOT NULL REFERENCES rooms(id),
  block_id    uuid,
  CONSTRAINT timetable_day_slot_class_key   UNIQUE (day, slot_id, class_id),
  CONSTRAINT timetable_day_slot_faculty_key UNIQUE (day, slot_id, faculty_id),
  CONSTRAINT timetable_day_slot_room_key    UNIQUE (day, slot_id, room_id)
);

CREATE TABLE leave_requests (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id  uuid NOT NULL REFERENCES faculty_profiles(id),
  date        date NOT NULL,
  reason      text,
  status      text NOT NULL CHECK (status IN ('approved')),
  CONSTRAINT leave_requests_faculty_date_key UNIQUE (faculty_id, date)
);

CREATE TABLE open_slots (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  leave_request_id     uuid NOT NULL REFERENCES leave_requests(id) ON DELETE CASCADE,
  timetable_id         uuid NOT NULL REFERENCES timetable(id) ON DELETE CASCADE,  -- FIRST row of lecture/lab block
  date                 date NOT NULL,
  slot_id              uuid NOT NULL REFERENCES time_slots(id),                   -- first slot
  end_slot_id          uuid NOT NULL REFERENCES time_slots(id),                   -- last slot (= slot_id for theory)
  class_id             uuid NOT NULL REFERENCES classes(id),
  room_id              uuid NOT NULL REFERENCES rooms(id),
  original_faculty_id  uuid NOT NULL REFERENCES faculty_profiles(id),
  status               text NOT NULL CHECK (status IN ('open','booked','cancelled')),
  CONSTRAINT open_slots_timetable_date_key UNIQUE (timetable_id, date)
);

CREATE TABLE extra_lectures (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  open_slot_id  uuid NOT NULL REFERENCES open_slots(id) ON DELETE CASCADE,
  faculty_id    uuid NOT NULL REFERENCES faculty_profiles(id),
  subject_id    uuid NOT NULL REFERENCES subjects(id),
  status        text NOT NULL CHECK (status IN ('confirmed','cancelled')),
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Only one confirmed extra lecture per open slot
CREATE UNIQUE INDEX extra_lectures_one_confirmed_per_open_slot
  ON extra_lectures (open_slot_id) WHERE status = 'confirmed';

CREATE TABLE lab_bookings (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id      uuid NOT NULL REFERENCES rooms(id),   -- engine enforces rooms.type = 'lab'
  faculty_id   uuid NOT NULL REFERENCES faculty_profiles(id),
  date         date NOT NULL,
  slot_id      uuid NOT NULL REFERENCES time_slots(id),  -- first slot
  end_slot_id  uuid NOT NULL REFERENCES time_slots(id),  -- second slot
  purpose      text NOT NULL,
  equipment    text[] NOT NULL DEFAULT '{}',             -- engine enforces subset of rooms.equipment
  status       text NOT NULL CHECK (status IN ('pending','approved','rejected'))
);

CREATE TABLE notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       text NOT NULL,
  message     text NOT NULL,
  type        text NOT NULL CHECK (type IN ('open_slot','booking_confirmed','slot_taken','lab_booking')),
  related_id  uuid,
  read        boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Fixed time slots (seeded, never edited). Fixed readable ids for stable demo/mocks.
INSERT INTO time_slots (id, slot_no, start_time, end_time) VALUES
  ('a0000000-0000-0000-0000-000000000001', 1, '09:00', '09:50'),
  ('a0000000-0000-0000-0000-000000000002', 2, '09:50', '10:40'),
  ('a0000000-0000-0000-0000-000000000003', 3, '10:40', '11:30'),
  ('a0000000-0000-0000-0000-000000000004', 4, '11:30', '12:20'),
  ('a0000000-0000-0000-0000-000000000005', 5, '12:20', '13:10'),
  ('a0000000-0000-0000-0000-000000000006', 6, '14:00', '14:50'),
  ('a0000000-0000-0000-0000-000000000007', 7, '14:50', '15:40');

-- Supabase Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE open_slots;
ALTER PUBLICATION supabase_realtime ADD TABLE extra_lectures;