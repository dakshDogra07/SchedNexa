# B-03 Plan

## Task
B-03 | P0 | engine/availability.ts + engine/conflicts.ts (5 checks, span aware) + script test | needs: B-01

## Goal
Create pure engine functions for schedule availability checks and the 5 conflict checks used by checkConflicts/bookSlot. No DB calls — services will pre-fetch data and pass it in.

## Sub-steps
1. [x] Create `engine/availability.ts` — ScheduleContext type, isBusyAt, isBusyForSpan
2. [x] Create `engine/conflicts.ts` — ConflictCheckInput type, runConflictChecks (5 checks, span-aware)
3. [x] Create `scripts/conflicts-test.ts` — pure logic tests (no DB needed)
4. [x] Run `tsc --noEmit` — 0 errors
5. [x] Run test script — all tests pass

## The 5 checks (from API_CONTRACT.md + PROJECT.md)
1. **faculty_free** — Faculty is not busy at (date, slotNos). Each slot checked.
2. **subject_eligible** — subjectId is in faculty_subjects.
3. **class_free** — Class is not busy at (date, slotNos). Each slot checked.
4. **room_reserved** — Room (from open slot) is not double-booked. Each slot checked.
5. **workload_ok** — currentTotalHours + span <= maxHours.

## Availability logic (from PROJECT.md)
An entity is BUSY at (date, slot) if:
- Has a timetable row at weekday(date)+slot with NO open_slot for that date; OR
- Has a confirmed extra_lecture there; OR
- Has an approved lab_booking there.

## Files to create
- `backend/engine/availability.ts`
- `backend/engine/conflicts.ts`
- `backend/scripts/conflicts-test.ts`

## Names (from docs)
- Types: Check, CheckResult from shared/types.ts
- Keys: faculty_free, subject_eligible, class_free, room_reserved, workload_ok
- Functions: isBusyAt, isBusyForSpan, runConflictChecks

## Verification
- tsc passes with 0 errors
- Test script exercises: all pass, faculty busy, subject ineligible, class busy, workload exceeded, span-aware (lab block)
- All pure logic — no DB or env vars needed — FULL verification possible
