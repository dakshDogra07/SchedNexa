# B-17 Plan

## Task
B-17 | P2 | getAnalytics | needs: B-16

## Goal
Implement analytics dataset service for charts (Recharts):
1. `BACKEND/schemas.ts`: Add `GetAnalyticsInput` Zod schema.
2. `BACKEND/services/analytics.ts`: Implement `getAnalytics` service returning `AnalyticsData` datasets (peakHourHeatmap, openSlotsStatus, hoursSavedTrend).

## Sub-steps
1. [x] Add Zod schema `GetAnalyticsInput` to `BACKEND/schemas.ts`.
2. [x] Create `BACKEND/services/analytics.ts` with `getAnalytics`.
3. [x] Wire `getAnalytics` in `BACKEND/index.ts` handlers registry.
4. [x] Create verification script `BACKEND/scripts/analytics-test.ts`.
5. [x] Add `"analytics-test": "tsx scripts/analytics-test.ts"` to `BACKEND/package.json`.
6. [x] Run `npm run typecheck` — 0 errors.
7. [x] Run `npm run analytics-test` — 0 errors.

## Key Business Rules Implemented
- `getAnalytics`:
  - Input: `{}`
  - Output: `AnalyticsData` (`Record<string, unknown[]>`)
  - `peakHourHeatmap`: Array of time slot lecture counts for heatmap visualisation.
  - `openSlotsStatus`: Array of open slots count by status (`Open`, `Booked`, `Cancelled`).
  - `hoursSavedTrend`: Trend array of cumulative hours saved by academic open slots.

## Files Created/Modified
- `BACKEND/schemas.ts` (updated: added GetAnalyticsInput)
- `BACKEND/services/analytics.ts` (created)
- `BACKEND/index.ts` (updated: wired getAnalytics)
- `BACKEND/scripts/analytics-test.ts` (created)
- `BACKEND/package.json` (updated: added analytics-test script)

## Verification Results
- `npm run typecheck` → Exit code 0, 0 errors
- `npm run analytics-test` → Exit code 0, schema validation & handler registry wiring verified
