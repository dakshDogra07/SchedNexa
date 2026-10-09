# B-05 Plan

## Task
B-05 | P0 | services/timetable: generateTimetable, getTimetable, getEffectiveSchedule | needs: B-02, B-04

## Goal
Implement timetable service functions in `services/timetable.ts` with Zod validation in `schemas.ts` and date calculation helpers in `lib/dates.ts`. Wire functions into `index.ts` `handlers` registry.

## Sub-steps
1. [x] Create `lib/dates.ts` — UTC date helpers (`getUTCDayOfWeek`, `isWeekend`)
2. [x] Update `schemas.ts` — Zod schemas for `GenerateTimetableInput`, `GetTimetableInput`, `GetEffectiveScheduleInput`
3. [x] Create `services/timetable.ts`:
   - `generateTimetable`: fetches base data, runs greedy generator, clears old timetable, inserts new rows, returns `GenerationResult`.
   - `getTimetable`: returns weekly template rows joined with related tables, filtered by `classId`, `facultyId`, or `roomId`.
   - `getEffectiveSchedule`: overlay schedule for a date with open slots, extra lectures, and lab bookings.
4. [x] Wire `services/timetable.ts` into `index.ts` `handlers` registry
5. [x] Create `scripts/timetable-test.ts` — verification script for input validation, date calculation, and DB queries
6. [x] Add `"timetable-test"` script to `package.json`
7. [x] Run `npm run typecheck` — 0 errors
8. [x] Run `npm run timetable-test` — all tests pass cleanly

## Rules & Constraints (from API_CONTRACT.md + ARCHITECTURE.md)
- Every function takes ONE object argument and returns `ApiResult<T>`.
- Input validated with Zod first.
- Dates are `YYYY-MM-DD` strings. Weekday in UTC: 1=Mon .. 5=Fri. Saturdays/Sundays return weekend error.
- `getTimetable` accepts at most ONE filter (`classId`, `facultyId`, or `roomId`).
- `getEffectiveSchedule` accepts at most ONE filter (`facultyId` or `classId`).

## Files created/modified
- `BACKEND/lib/dates.ts`
- `BACKEND/schemas.ts`
- `BACKEND/services/timetable.ts`
- `BACKEND/index.ts`
- `BACKEND/scripts/timetable-test.ts`
- `BACKEND/package.json`

## Verification Results
- `npm run typecheck` (`tsc --noEmit`) returned 0 errors.
- `npm run timetable-test` (`tsx scripts/timetable-test.ts`) returned exit code 0:
  - Date calculation helpers verified
  - Multi-filter validation errors verified
  - Weekend date validation error verified
  - Database queries and RPC handlers executed cleanly against Supabase
