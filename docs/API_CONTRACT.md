# API_CONTRACT - LOCKED

Must match `ApiContract` in shared/types.ts exactly (30 functions, no others).

## Conventions
- Transport: `POST /api/rpc/<functionName>` with a JSON body = the single input object.
- Every function takes ONE object and returns `ApiResult<T>`: `{ ok: true, data } | { ok: false, error }`.
- Input is validated with the Zod schema in backend/schemas.ts first. Invalid input -> `{ ok: false, error }` with a readable message. Functions never throw to the client.
- Dates are `YYYY-MM-DD`. Ids are uuid strings. `facultyId` = faculty_profiles.id. `userId` = users.id.
- Weekday is computed in UTC (backend/lib/dates.ts). 1=Mon .. 5=Fri.
- Conflict logic lives ONLY in engine/conflicts.ts.
- Common error cases for every function: invalid input (Zod), unknown id, database failure.

---

## P0

### ping
- Input: `{}`
- Output: `{ time: string }`
- Behavior: returns the server time. Used for the wiring smoke test.
- Errors: none beyond common.

### getDemoUsers
- Input: `{}`
- Output: `DemoUser[]` (id, name, role, facultyId?)
- Behavior: returns the demo login users (Admin, Dr. Sharma, Prof. Kaur).
- Errors: none beyond common.

### resetDemo
- Input: `{}`
- Output: `{ message: string }`
- Behavior: restores base data plus the FIXED demo timetable (shared/seed.sql mode 2), clearing leave_requests, open_slots, extra_lectures, lab_bookings and notifications.
- Errors: database failure.

### generateTimetable
- Input: `{}`
- Output: `GenerationResult { lecturesPlaced, conflicts, unscheduled[{classId,subjectId,reason}], facultyAtFullLoad }`
- Behavior: runs engine/generator.ts (greedy, lab blocks first) and replaces the whole timetable. Unplaceable lectures go to `unscheduled` with a reason. Never throws.
- Errors: database failure while replacing the timetable.

### getTimetable
- Input: `{ classId?: string; facultyId?: string; roomId?: string }`
- Output: `TimetableEntry[]` (joined names, slot times, blockId)
- Behavior: returns weekly template rows, filtered by the given id. Without a filter returns all rows. The template is never modified by leave or extra lectures.
- Errors: more than one filter given; unknown id.

### getEffectiveSchedule
- Input: `{ date: string; facultyId?: string; classId?: string }`
- Output: `ScheduleEntry[]` with `state: normal | open | extra | lab_booking`
- Behavior: overlay for a date: template rows for weekday(date); open_slots status open -> `open` (no teacher); status booked -> `extra` (extra lecture subject and faculty); plus approved lab_bookings as `lab_booking`.
- Errors: date is a weekend; both filters given.

### getLeaveImpact
- Input: `{ facultyId: string; dateFrom: string; dateTo: string }`
- Output: `AffectedLecture[]`
- Behavior: lists the lectures/lab blocks (one entry per block) that would become open slots for the range. Weekend dates are skipped. Read-only.
- Errors: dateFrom after dateTo; unknown facultyId.

### markLeave
- Input: `{ facultyId: string; dateFrom: string; dateTo: string; reason?: string }`
- Output: `OpenSlot[]`
- Behavior: creates auto-approved leave_requests (one per non-weekend date), creates one open_slots row per lecture/lab block (status open, class/room/time reserved), inserts notifications (type open_slot) for eligible faculty. Assigned hours of the faculty on leave are unchanged.
- Errors: dateFrom after dateTo; leave already exists for a date (UNIQUE faculty_id, date); range has only weekend dates.

### getOpenSlots
- Input: `{ facultyId?: string; status?: 'open' | 'booked' | 'cancelled' }`
- Output: `OpenSlotView[]` (joined names, span, score if facultyId)
- Behavior: lists open slots filtered by status. With `facultyId`, `score` is filled (rule-based, see getRecommendations); otherwise `score` is null.
- Errors: unknown facultyId.

### checkConflicts
- Input: `{ openSlotId: string; facultyId: string; subjectId: string }`
- Output: `{ ok: boolean; checks: Check[{ key, label, passed, detail }] }` (exactly 5 checks)
- Behavior: runs the 5 checks via engine/conflicts.ts, each covering EVERY slot of the span: faculty free, subject eligible, class free, room reserved for this slot, workload within max_hours. `ok` is true only if all 5 pass. Read-only.
- Errors: unknown openSlotId, facultyId or subjectId.

### bookSlot
- Input: `{ openSlotId: string; facultyId: string; subjectId: string }`
- Output: `ExtraLecture`
- Behavior: re-runs the 5 checks; if all pass, inserts a confirmed extra_lectures row, sets open_slots.status = booked, notifies users (booking_confirmed, slot_taken). Only one confirmed extra lecture per open slot.
- Errors: any check fails (error lists failed checks); open slot not in status open (already booked/cancelled).

### getNotifications
- Input: `{ userId: string }`
- Output: `Notification[]` (newest first)
- Behavior: returns all notifications of the user.
- Errors: unknown userId.

### markNotificationRead
- Input: `{ notificationId: string }`
- Output: `{ done: true }`
- Behavior: sets notifications.read = true.
- Errors: unknown notificationId.

---

## P1

### getWorkload
- Input: `{ facultyId?: string }`
- Output: `WorkloadRow[]` (required, assigned, extra, total, max, status)
- Behavior: assigned = timetable rows of the faculty; extra = sum of span of confirmed extra lectures that week; total = assigned + extra; status: under if assigned < required, ok if between required and max, over if total > max. Without `facultyId` returns all faculty.
- Errors: unknown facultyId.

### getRoomAvailability
- Input: `{ date: string }`
- Output: `RoomAvailability` (rooms x slots: free | busy | open + who)
- Behavior: state of every room at every slot for the date, using the effective schedule overlay.
- Errors: date is a weekend.

### getRecommendations
- Input: `{ openSlotId: string }`
- Output: `Recommendation[]` (facultyId, facultyName, score, reasons[])
- Behavior: ranks faculty by rule-based score: available +30, can teach +30, no conflict +20, class/semester suitable +10, workload below target +10. Score only ranks; booking is decided by checkConflicts.
- Errors: unknown openSlotId.

### listFaculty / listSubjects / listClasses / listRooms
- Input: `{}`
- Output: `FacultyView[]` / `Subject[]` / `Class[]` / `Room[]`
- Behavior: list all records of the entity.
- Errors: none beyond common.

### upsertFaculty / upsertSubject / upsertClass / upsertRoom
- Input: entity fields; `id` absent = create, `id` present = update.
  - upsertFaculty: `{ id?, user_id, department, required_hours, max_hours }`
  - upsertSubject: `{ id?, name, code, department, semester, type, hours_per_week }`
  - upsertClass: `{ id?, name, department, semester, student_count }`
  - upsertRoom: `{ id?, name, capacity, type, equipment }`
- Output: the saved entity (`FacultyProfile` / `Subject` / `Class` / `Room`)
- Behavior: validates and saves. Lab subject must have even hours_per_week; max_hours >= required_hours; classrooms have empty equipment.
- Errors: duplicate unique value (code, name); constraint violation; unknown id on update.

### moveTimetableEntry
- Input: `{ timetableId: string; day: number; slotId: string; roomId?: string }`
- Output: `{ ok: boolean; conflicts: string[] }`
- Behavior: moves a template entry after validating all hard constraints via engine/conflicts.ts. A lab block moves as a whole (target must be a valid lab block). Nothing is saved when `ok` is false.
- Errors: unknown ids; day not 1-5; invalid lab block target (conflicts are returned in `conflicts`).

### createLabBooking
- Input: `{ roomId: string; facultyId: string; date: string; slotId: string; purpose: string; equipment: string[] }`
- Output: `LabBooking`
- Behavior: `slotId` is the FIRST slot of a valid lab block; the second slot is derived. Auto-approved if lab and faculty are free for both slots, otherwise saved as rejected with the reason in the returned booking context (error text). Notifies (lab_booking).
- Errors: room is not type lab; not a valid lab block; equipment not a subset of rooms.equipment; weekend date.

### listLabBookings
- Input: `{ facultyId?: string }`
- Output: `LabBooking[]`
- Behavior: with `facultyId` returns that faculty's bookings; without it returns all (admin).
- Errors: unknown facultyId.

### decideLabBooking
- Input: `{ bookingId: string; status: 'pending' | 'approved' | 'rejected' }`
- Output: `LabBooking`
- Behavior: admin changes the booking status (cancel/reject = `rejected`). Approving re-checks lab and faculty availability.
- Errors: unknown bookingId; approval would cause a conflict.

### getDashboardStats
- Input: `{}`
- Output: `DashboardStats { lectures, conflicts, roomUtilizationPct, openSlotsFilled, hoursSaved }`
- Behavior: aggregate numbers for the admin dashboard and the landing page.
- Errors: none beyond common.

---

## P2

### getAnalytics
- Input: `{}`
- Output: `AnalyticsData` (chart datasets)
- Behavior: datasets for peak-hour heatmap, open slots filled vs wasted, hours saved.
- Errors: none beyond common.