# PROJECT

## Product
A scheduling platform that decides who teaches what, when and where.
Tagline: Do not let a cancelled lecture become a wasted academic hour.

## Problem statement
Smart Resource Booking, Faculty Load & Timetable Management. A centralized system to manage classrooms, labs, faculty workload and timetables. Example: a faculty with a required load of 25 hours/week must have that load considered while the timetable is generated and managed.

PS features: faculty workload management, automated timetable generation, classroom and lab allocation, lab resource booking, prevention of room and faculty conflicts, real-time availability of rooms and labs, resource utilization dashboard, faculty workload reports, timetable export and PDF.

## USP: Open Academic Slot
1. A faculty marks leave. The lecture is not deleted.
2. Class, room and time stay reserved as an Open Academic Slot, created from the original timetable entry.
3. Eligible faculty are notified in-app.
4. One faculty takes the slot (opt-in) for one of THEIR OWN eligible subjects after all conflict checks pass.

## Roles
admin, faculty. No student role.

## Fixed values
- Days: 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri.
- Time slots (table time_slots, seeded, never edited):

| slot_no | start_time | end_time |
|---|---|---|
| 1 | 09:00 | 09:50 |
| 2 | 09:50 | 10:40 |
| 3 | 10:40 | 11:30 |
| 4 | 11:30 | 12:20 |
| 5 | 12:20 | 13:10 |
| break | 13:10 | 14:00 (no slot) |
| 6 | 14:00 | 14:50 |
| 7 | 14:50 | 15:40 |

- 7 slots/day, 35 slots/week, 50 minutes each.
- Workload is counted in slots: 1 slot = 1 hour of workload.
- Lab subject = BLOCK of 2 consecutive slots (same class, same faculty, same lab room). Theory lecture = exactly 1 slot.
- Valid lab blocks (start, end): (1,2) (2,3) (3,4) (4,5) (6,7). (5,6) is INVALID (crosses the break).
- subjects.hours_per_week for a lab subject must be EVEN (sessions per week = hours_per_week / 2).
- Open slot from a lab block = ONE open slot with span 2, taken as a whole by a faculty with a lab subject. Span = end slot_no - start slot_no + 1.

## Business rules
### Timetable hard constraints
- No faculty, room or class double-booking.
- Room capacity >= class student_count.
- Lab subjects only in lab rooms; theory subjects only in classrooms.
- Faculty total hours never exceed max_hours.
- Faculty teach only subjects in faculty_subjects.

### Open slot
- Created from the original timetable entry. Class, room and time remain reserved.
- Taking it is opt-in. The faculty must pick one of their OWN eligible subjects.
- Before confirming a booking ALL 5 checks must pass: faculty free, subject eligible, class free, room reserved for this slot, workload within max_hours. For a 2-slot span each check covers BOTH slots.
- Taking a booked open slot again must fail. Only one confirmed extra lecture per open slot.
- Extra lectures count toward the taking faculty's workload. The faculty on leave keeps assigned hours unchanged.

### Recommendation score (rule-based, explainable, no ML)
available +30, can teach +30, no conflict +20, class/semester suitable +10, workload below target +10. The score only ranks faculty. Booking is decided by the deterministic checks.

### Leave
Auto-approved (no approval flow). Single date or date range (dateFrom..dateTo). Weekend dates are skipped.

### Lab booking (ad-hoc)
Faculty books a lab for 2 consecutive valid slots with an equipment tick-list. Auto-approved if the lab and faculty are free for both slots, otherwise rejected with a reason. Admin sees all bookings and can cancel/reject.

### Notifications
In-app only (notifications table). No email/WhatsApp.

## Logic rules
### Effective schedule for a date (overlay)
- Take template rows where day = weekday(date).
- If an open_slots row exists for (timetable_id, date): status open -> show as OPEN (class, room, time reserved, no teacher); status booked -> show the extra lecture subject and faculty instead.
- Add approved lab_bookings for that date.

### Availability
A faculty is BUSY at (date, slot) if:
- they have a template row at weekday(date)+slot with no open_slot for that date (an open_slot means they are on leave, so free); or
- they have a confirmed extra_lecture there; or
- they have an approved lab_booking there.

Classes and rooms follow the same logic. A booking check covers EVERY slot of the span. If any slot fails, the whole booking fails.

### Workload (per faculty, per week)
- assigned_hours = count of timetable rows for that faculty (lab block = 2 rows = 2 hours; leave does not reduce it)
- extra_hours = sum of span over confirmed extra_lectures that week (theory 1, lab 2)
- total_hours = assigned_hours + extra_hours
- Booking allowed only if total_hours + span <= max_hours
- Status: under if assigned_hours < required_hours; ok if between required and max; over if total_hours > max_hours

### Generator
engine/generator.ts is a PURE greedy function: input (classes, subjects, class_subjects, faculty, faculty_subjects, rooms, time_slots) -> output (lectures[], unscheduled[] with reason). Place lab blocks first, then theory lectures. Respect all hard constraints. Never throw. Unplaceable lectures go to unscheduled with a human-readable reason. services/timetable.ts replaces the whole timetable and returns summary counts (lectures, conflicts, unscheduled, faculty at full load).

## Feature priority
### P0 (before the 2-hour elimination round)
- Demo login (Admin / Dr. Sharma / Prof. Kaur quick buttons)
- Seed demo data + Reset Demo
- Automated timetable generation (greedy) with conflict prevention
- Timetable grid (class-wise and faculty-wise)
- Mark leave -> Open Academic Slot
- In-app notification to eligible faculty
- Open slot booking: own-subject selection + live conflict checks
- Confirm extra lecture -> timetable and workload update

### P1 (after elimination)
- Faculty workload dashboard (required / assigned / extra, progress bars)
- Room and lab availability grid (free/busy)
- Setup screens (CRUD faculty, subjects, classes, rooms)
- Manual timetable edit with instant conflict warning
- Unscheduled lectures list with reasons
- Recommendation with match score
- Lab resource booking
- Leave date range
- Utilization dashboard (admin)
- PDF export (timetable, workload report)
- Landing page with live stats

### P2 (only if time remains)
- Analytics charts (peak-hour heatmap, open slots filled vs wasted, hours saved)
- Room utilization PDF
- CSV import

### Out of scope (never build)
Email/WhatsApp, student dashboard, attendance, mobile app, LLM features, OR-Tools/genetic optimization, Row Level Security.