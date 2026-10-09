# B-10 Plan

## Task
B-10 | P1 | engine/workload.ts + getWorkload | needs: B-02

## Goal
Implement workload engine and service:
1. `BACKEND/engine/workload.ts`: Pure function `calculateWorkloadRow` and `computeWorkloadStatus`.
   - assigned_hours = count of timetable rows for faculty.
   - extra_hours = sum of span of confirmed extra lectures that week.
   - total_hours = assigned_hours + extra_hours.
   - status: 'under' if assigned_hours < required_hours; 'ok' if between required and max; 'over' if total_hours > max_hours.
2. `BACKEND/services/workload.ts`: `getWorkload` service to query faculty, compute workload rows, and return `WorkloadRow[]`.

## Sub-steps
1. [x] Add Zod schema `GetWorkloadInput` to `BACKEND/schemas.ts`.
2. [x] Create `BACKEND/engine/workload.ts` with pure calculation functions.
3. [x] Create `BACKEND/services/workload.ts` with `getWorkload`.
4. [x] Wire `getWorkload` in `BACKEND/index.ts` handlers registry.
5. [x] Create verification script `BACKEND/scripts/workload-test.ts`.
6. [x] Add `"workload-test": "tsx scripts/workload-test.ts"` to `BACKEND/package.json`.
7. [x] Run `npm run typecheck` — 0 errors.
8. [x] Run `npm run workload-test` — 0 errors.

## Key Business Rules Implemented
- `getWorkload`:
  - Input: `{ facultyId?: string }`
  - Output: `WorkloadRow[]`
  - Validates `facultyId` if provided. Returns error if faculty profile does not exist.
  - Returns required, assigned, extra, total, max, and status ('under' | 'ok' | 'over').

## Files Created/Modified
- `BACKEND/schemas.ts` (updated: added GetWorkloadInput)
- `BACKEND/engine/workload.ts` (created)
- `BACKEND/services/workload.ts` (created)
- `BACKEND/index.ts` (updated: wired getWorkload)
- `BACKEND/scripts/workload-test.ts` (created)
- `BACKEND/package.json` (updated: added workload-test script)

## Verification Results
- `npm run typecheck` → Exit code 0, 0 errors
- `npm run workload-test` → Exit code 0, all calculations and service validation verified
