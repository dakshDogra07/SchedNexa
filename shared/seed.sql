-- shared/seed.sql  LOCKED
-- time_slots are inserted in shared/schema.sql (not repeated here).
-- MODE 1: base data only (users .. rooms).
-- MODE 2: base data + FIXED demo timetable (used by resetDemo). Run MODE 1 once, then MODE 2.
-- Fixed readable uuids:
--   users 1000.. | faculty_profiles 2000.. | subjects 3000.. | classes 4000.. | rooms 5000..
--   timetable d000.. (n = 1..100) | lab block ids b000.. (1..16) | time_slots a000.. (schema.sql)

-- =========================== MODE 1: BASE DATA ===========================

INSERT INTO users (id, name, email, role, department) VALUES
  ('10000000-0000-0000-0000-000000000001', 'Admin',        'admin@college.edu',  'admin',   'Administration'),
  ('10000000-0000-0000-0000-000000000002', 'Dr. Sharma',   'sharma@college.edu', 'faculty', 'CSE'),
  ('10000000-0000-0000-0000-000000000003', 'Prof. Kaur',   'kaur@college.edu',   'faculty', 'CSE'),
  ('10000000-0000-0000-0000-000000000004', 'Dr. Mehta',    'mehta@college.edu',  'faculty', 'CSE'),
  ('10000000-0000-0000-0000-000000000005', 'Dr. Verma',    'verma@college.edu',  'faculty', 'CSE'),
  ('10000000-0000-0000-0000-000000000006', 'Dr. Iyer',     'iyer@college.edu',   'faculty', 'CSE');

-- faculty_id = faculty_profiles.id
INSERT INTO faculty_profiles (id, user_id, department, required_hours, max_hours) VALUES
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'CSE', 20, 24), -- Sharma
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003', 'CSE', 20, 24), -- Kaur
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000004', 'CSE', 20, 24), -- Mehta
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000005', 'CSE', 20, 24), -- Verma
  ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000006', 'CSE', 20, 24); -- Iyer

INSERT INTO subjects (id, name, code, department, semester, type, hours_per_week) VALUES
  ('30000000-0000-0000-0000-000000000001', 'DBMS',                   'CS301', 'CSE', 3, 'theory', 4),
  ('30000000-0000-0000-0000-000000000002', 'Data Structures',        'CS302', 'CSE', 3, 'theory', 5),
  ('30000000-0000-0000-0000-000000000003', 'Discrete Mathematics',   'CS303', 'CSE', 3, 'theory', 4),
  ('30000000-0000-0000-0000-000000000004', 'Computer Organization',  'CS304', 'CSE', 3, 'theory', 4),
  ('30000000-0000-0000-0000-000000000005', 'DBMS Lab',               'CS351', 'CSE', 3, 'lab',    4),
  ('30000000-0000-0000-0000-000000000006', 'Data Structures Lab',    'CS352', 'CSE', 3, 'lab',    4),
  ('30000000-0000-0000-0000-000000000007', 'Operating Systems',      'CS501', 'CSE', 5, 'theory', 4),
  ('30000000-0000-0000-0000-000000000008', 'Computer Networks',      'CS502', 'CSE', 5, 'theory', 4),
  ('30000000-0000-0000-0000-000000000009', 'Software Engineering',   'CS503', 'CSE', 5, 'theory', 4),
  ('30000000-0000-0000-0000-000000000010', 'Theory of Computation',  'CS504', 'CSE', 5, 'theory', 5),
  ('30000000-0000-0000-0000-000000000011', 'Operating Systems Lab',  'CS551', 'CSE', 5, 'lab',    4),
  ('30000000-0000-0000-0000-000000000012', 'Computer Networks Lab',  'CS552', 'CSE', 5, 'lab',    4);

INSERT INTO classes (id, name, department, semester, student_count) VALUES
  ('40000000-0000-0000-0000-000000000001', 'CSE-3A', 'CSE', 3, 55),
  ('40000000-0000-0000-0000-000000000002', 'CSE-3B', 'CSE', 3, 52),
  ('40000000-0000-0000-0000-000000000003', 'CSE-5A', 'CSE', 5, 50),
  ('40000000-0000-0000-0000-000000000004', 'CSE-5B', 'CSE', 5, 48);

-- Every class takes all subjects of its semester (weekly hours come from subjects.hours_per_week)
INSERT INTO class_subjects (class_id, subject_id)
SELECT c.id, s.id FROM classes c JOIN subjects s ON s.semester = c.semester;

INSERT INTO faculty_subjects (faculty_id, subject_id) VALUES
  -- Dr. Sharma: DBMS, Discrete Mathematics, DBMS Lab
  ('20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000003'),
  ('20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000005'),
  -- Prof. Kaur: Operating Systems, Software Engineering, OS Lab
  ('20000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000007'),
  ('20000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000009'),
  ('20000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000011'),
  -- Dr. Mehta: Discrete Mathematics, Computer Organization, DS Lab
  ('20000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003'),
  ('20000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000004'),
  ('20000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000006'),
  -- Dr. Verma: Computer Networks, Software Engineering, CN Lab
  ('20000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000008'),
  ('20000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000009'),
  ('20000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000012'),
  -- Dr. Iyer: Data Structures, Theory of Computation
  ('20000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000002'),
  ('20000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000010');

INSERT INTO rooms (id, name, capacity, type, equipment) VALUES
  ('50000000-0000-0000-0000-000000000001', 'Room 101', 60, 'classroom', '{}'),
  ('50000000-0000-0000-0000-000000000002', 'Room 102', 60, 'classroom', '{}'),
  ('50000000-0000-0000-0000-000000000003', 'Room 103', 60, 'classroom', '{}'),
  ('50000000-0000-0000-0000-000000000004', 'Room 104', 60, 'classroom', '{}'),
  ('50000000-0000-0000-0000-000000000005', 'Lab 1',    60, 'lab', ARRAY['Desktop PCs','Projector','Database Server']),
  ('50000000-0000-0000-0000-000000000006', 'Lab 2',    60, 'lab', ARRAY['Desktop PCs','Projector','Network Switches']);

-- ===================== MODE 2: FIXED DEMO TIMETABLE =====================
-- Reset all dynamic data, then insert the fixed weekly template (100 rows).

DELETE FROM notifications;
DELETE FROM extra_lectures;
DELETE FROM open_slots;
DELETE FROM lab_bookings;
DELETE FROM leave_requests;
DELETE FROM timetable;

-- Columns: n = row number, day, slot_no, c = class (1=3A 2=3B 3=5A 4=5B), s = subject (1..12),
--          f = faculty (1=Sharma 2=Kaur 3=Mehta 4=Verma 5=Iyer), r = room (1..4 classrooms, 5=Lab 1, 6=Lab 2),
--          b = lab block number (NULL for theory). Lab blocks use slots (1,2) or (3,4) only.
INSERT INTO timetable (id, day, slot_id, class_id, subject_id, faculty_id, room_id, block_id)
SELECT
  ('d0000000-0000-0000-0000-' || lpad(v.n::text, 12, '0'))::uuid,
  v.day,
  ts.id,
  ('40000000-0000-0000-0000-' || lpad(v.c::text, 12, '0'))::uuid,
  ('30000000-0000-0000-0000-' || lpad(v.s::text, 12, '0'))::uuid,
  ('20000000-0000-0000-0000-' || lpad(v.f::text, 12, '0'))::uuid,
  ('50000000-0000-0000-0000-' || lpad(v.r::text, 12, '0'))::uuid,
  CASE WHEN v.b IS NULL THEN NULL
       ELSE ('b0000000-0000-0000-0000-' || lpad(v.b::text, 12, '0'))::uuid END
FROM (VALUES
  -- ===== Monday (day 1) =====
  (1,1,1,1,5,1,5,1),(2,1,2,1,5,1,5,1),(3,1,3,1,2,5,1,NULL),(4,1,4,1,4,3,1,NULL),(5,1,5,1,1,1,1,NULL),(6,1,6,1,3,1,1,NULL),
  (7,1,3,2,5,1,5,2),(8,1,4,2,5,1,5,2),(9,1,1,2,3,3,2,NULL),(10,1,2,2,2,5,2,NULL),(11,1,5,2,4,3,2,NULL),(12,1,7,2,1,1,2,NULL),
  (13,1,1,3,11,2,6,3),(14,1,2,3,11,2,6,3),(15,1,3,3,8,4,3,NULL),(16,1,4,3,10,5,3,NULL),(17,1,5,3,7,2,3,NULL),(18,1,6,3,9,2,3,NULL),
  (19,1,3,4,11,2,6,4),(20,1,4,4,11,2,6,4),(21,1,1,4,8,4,4,NULL),(22,1,2,4,9,4,4,NULL),(23,1,5,4,10,5,4,NULL),(24,1,7,4,7,2,4,NULL),
  -- ===== Tuesday (day 2) =====
  (25,2,3,1,6,3,5,5),(26,2,4,1,6,3,5,5),(27,2,1,1,2,5,1,NULL),(28,2,2,1,1,1,1,NULL),(29,2,5,1,4,3,1,NULL),(30,2,6,1,3,1,1,NULL),
  (31,2,1,2,6,3,5,6),(32,2,2,2,6,3,5,6),(33,2,3,2,2,5,2,NULL),(34,2,4,2,1,1,2,NULL),(35,2,6,2,3,3,2,NULL),(36,2,7,2,4,3,2,NULL),
  (37,2,3,3,12,4,6,7),(38,2,4,3,12,4,6,7),(39,2,1,3,7,2,3,NULL),(40,2,2,3,10,5,3,NULL),(41,2,5,3,8,4,3,NULL),(42,2,6,3,9,2,3,NULL),
  (43,2,1,4,12,4,6,8),(44,2,2,4,12,4,6,8),(45,2,3,4,7,2,4,NULL),(46,2,4,4,10,5,4,NULL),(47,2,6,4,8,4,4,NULL),(48,2,7,4,9,4,4,NULL),
  -- ===== Wednesday (day 3) =====
  (49,3,1,1,5,1,5,9),(50,3,2,1,5,1,5,9),(51,3,3,1,2,5,1,NULL),(52,3,4,1,4,3,1,NULL),(53,3,5,1,3,1,1,NULL),
  (54,3,3,2,5,1,5,10),(55,3,4,2,5,1,5,10),(56,3,1,2,2,5,2,NULL),(57,3,2,2,4,3,2,NULL),(58,3,6,2,1,1,2,NULL),
  (59,3,1,3,11,2,6,11),(60,3,2,3,11,2,6,11),(61,3,4,3,10,5,3,NULL),(62,3,5,3,7,2,3,NULL),(63,3,6,3,8,4,3,NULL),
  (64,3,3,4,11,2,6,12),(65,3,4,4,11,2,6,12),(66,3,2,4,10,5,4,NULL),(67,3,5,4,9,4,4,NULL),(68,3,6,4,7,2,4,NULL),
  -- ===== Thursday (day 4) =====
  (69,4,3,1,6,3,5,13),(70,4,4,1,6,3,5,13),(71,4,1,1,2,5,1,NULL),(72,4,2,1,1,1,1,NULL),(73,4,5,1,4,3,1,NULL),
  (74,4,1,2,6,3,5,14),(75,4,2,2,6,3,5,14),(76,4,3,2,2,5,2,NULL),(77,4,4,2,1,1,2,NULL),(78,4,6,2,3,3,2,NULL),
  (79,4,3,3,12,4,6,15),(80,4,4,3,12,4,6,15),(81,4,1,3,9,2,3,NULL),(82,4,2,3,10,5,3,NULL),(83,4,5,3,8,4,3,NULL),
  (84,4,1,4,12,4,6,16),(85,4,2,4,12,4,6,16),(86,4,3,4,7,2,4,NULL),(87,4,4,4,10,5,4,NULL),(88,4,6,4,8,4,4,NULL),
  -- ===== Friday (day 5) =====  row 90 = DEMO: Sharma, DBMS, CSE-3A, Room 101, slot 2 (09:50-10:40)
  (89,5,1,1,2,5,1,NULL),(90,5,2,1,1,1,1,NULL),(91,5,4,1,3,1,1,NULL),
  (92,5,3,2,2,5,2,NULL),(93,5,5,2,3,3,2,NULL),(94,5,6,2,4,3,2,NULL),
  (95,5,1,3,7,2,3,NULL),(96,5,3,3,9,2,3,NULL),(97,5,5,3,10,5,3,NULL),
  (98,5,4,4,8,4,4,NULL),(99,5,6,4,10,5,4,NULL),(100,5,7,4,9,4,4,NULL)
) AS v(n, day, slot_no, c, s, f, r, b)
JOIN time_slots ts ON ts.slot_no = v.slot_no;