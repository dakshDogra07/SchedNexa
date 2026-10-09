# B-08 Plan

## Task
B-08 | P0 | services/notifications: getNotifications, markNotificationRead | needs: B-02

## Goal
Implement notification services in `BACKEND/services/notifications.ts`:
1. `getNotifications`: Fetch all notifications for a given `userId`, ordered newest first (`created_at` DESC). Validate user existence in `users` table.
2. `markNotificationRead`: Update `notifications` table set `read = true` for a given `notificationId`.

## Sub-steps
1. [x] Add Zod schemas `GetNotificationsInput` and `MarkNotificationReadInput` to `BACKEND/schemas.ts`.
2. [x] Create `BACKEND/services/notifications.ts` with `getNotifications` and `markNotificationRead`.
3. [x] Wire handlers in `BACKEND/index.ts` replacing `notImplemented()` stubs.
4. [x] Create verification script `BACKEND/scripts/notifications-test.ts`.
5. [x] Add `"notifications-test": "tsx scripts/notifications-test.ts"` to `BACKEND/package.json`.
6. [x] Run `npm run typecheck` — 0 errors.
7. [x] Run `npm run notifications-test` — 0 errors.

## Key Business Rules Implemented
- `getNotifications`:
  - Input: `{ userId: string }`
  - Validates `userId` with Zod. Checks if user exists in `users` table. Returns `{ ok: false, error: 'User not found' }` if missing.
  - Queries `notifications` table where `user_id = userId`, ordered by `created_at` DESC.
  - Returns `Notification[]`.
- `markNotificationRead`:
  - Input: `{ notificationId: string }`
  - Validates `notificationId` with Zod. Checks if notification exists in `notifications` table. Returns `{ ok: false, error: 'Notification not found' }` if missing.
  - Updates `notifications` set `read = true` where `id = notificationId`.
  - Returns `{ done: true }`.

## Files Created/Modified
- `BACKEND/schemas.ts` (updated: added GetNotificationsInput, MarkNotificationReadInput)
- `BACKEND/services/notifications.ts` (created: getNotifications, markNotificationRead)
- `BACKEND/index.ts` (updated: imported and registered notification handlers)
- `BACKEND/scripts/notifications-test.ts` (created)
- `BACKEND/package.json` (updated: added notifications-test npm script)

## Verification Results
- `npm run typecheck` → Exit code 0, 0 errors
- `npm run notifications-test` → Exit code 0, all tests passed
