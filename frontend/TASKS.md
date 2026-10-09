# Frontend Tasks Roadmap (SchedNexa)

This roadmap outlines all frontend tasks grouped by priority (Must-have, Should-have, Nice-to-have).
All modifications are strictly confined inside the `frontend/` directory.

---

## Group 1: Must-Have (P0 — Core USP & Demo Flow)

### [ ] Task 1.1: Project Scaffolding, Design System & Wiring (F-01)
- **What to do**:
  - Initialize `frontend/package.json` with Next.js, React, TypeScript, Tailwind CSS, lucide-react, clsx, tailwind-merge, class-variance-authority, and shadcn dependencies.
  - Setup `frontend/tsconfig.json` with path aliases (`@/*` -> `./*`, `@shared/*` -> `../shared/*`, `@backend/*` -> `../backend/*`).
  - Configure `frontend/next.config.mjs` with `experimental.externalDir = true`.
  - Configure `frontend/tailwind.config.ts`, `frontend/postcss.config.mjs`, and `frontend/app/globals.css` with the design tokens from `docs/DESIGN.md` (Primary `#4F46E5`, clean SaaS productivity tokens, status colors: green=free/ok, red=busy/over, amber=open slot).
- **Files touched**:
  - `frontend/package.json`
  - `frontend/tsconfig.json`
  - `frontend/next.config.mjs`
  - `frontend/tailwind.config.ts`
  - `frontend/postcss.config.mjs`
  - `frontend/app/globals.css`
  - `frontend/app/layout.tsx`
  - `frontend/lib/utils.ts`
- **Estimated effort**: Medium

---

### [ ] Task 1.2: API RPC Dispatcher, Mock Data Store & Session Auth (F-01, F-02)
- **What to do**:
  - Implement `frontend/app/api/rpc/[fn]/route.ts` generic dispatcher that forwards calls to the backend handler registry or serves mocks.
  - Implement `frontend/lib/api.ts` exposing typed `api.call(functionName, input)` respecting `NEXT_PUBLIC_USE_MOCK`.
  - Build `frontend/mock/store.ts` and `frontend/mock/handlers.ts` loaded with data matching `shared/seed.sql` and handling all 30 `ApiContract` methods for standalone operation.
  - Implement `frontend/lib/session.ts` for cookie-based demo auth (Admin, Dr. Sharma, Prof. Kaur) with `role`, `userId`, and `facultyId`.
  - Implement `frontend/lib/supabase-browser.ts` client setup for realtime subscriptions.
- **Files touched**:
  - `frontend/app/api/rpc/[fn]/route.ts`
  - `frontend/lib/api.ts`
  - `frontend/lib/session.ts`
  - `frontend/lib/supabase-browser.ts`
  - `frontend/mock/store.ts`
  - `frontend/mock/handlers.ts`
- **Estimated effort**: Large

---

### [ ] Task 1.3: App Layouts, Role Guards & Demo Login Screen (F-02)
- **What to do**:
  - Build `frontend/app/login/page.tsx` with one-click demo login buttons ("Admin", "Dr. Sharma", "Prof. Kaur") and a "Reset Demo" action button.
  - Implement `frontend/app/admin/layout.tsx` with sidebar navigation (Dashboard, Setup, Timetable, Workload, Rooms & Labs, Open Slots, Reports) and admin role verification.
  - Implement `frontend/app/faculty/layout.tsx` with sidebar navigation (My Dashboard, My Timetable, Mark Leave, Open Slots, Book Lab) and top navigation bar with notification bell.
  - Add session switch banner in header for quick user switching during demo presentations.
- **Files touched**:
  - `frontend/app/login/page.tsx`
  - `frontend/app/admin/layout.tsx`
  - `frontend/app/faculty/layout.tsx`
  - `frontend/components/sidebar.tsx`
  - `frontend/components/header.tsx`
  - `frontend/components/demo-banner.tsx`
- **Estimated effort**: Medium

---

### [ ] Task 1.4: Timetable Grid Component (F-03)
- **What to do**:
  - Build `frontend/components/timetable-grid.tsx`:
    - Columns: Monday through Friday (days 1 to 5).
    - Rows: 7 time slots (09:00 - 15:40) with exact start and end times.
    - Lunch break row inserted between slot 5 (12:20-13:10) and slot 6 (14:00-14:50).
    - Single unified cell spanning 2 rows for lab blocks.
    - Semantic states: normal lecture, amber `OPEN` badge for open academic slots, extra lecture (displaying new subject and taking faculty), and approved lab booking.
    - Clickable slots for inspecting lecture details or triggering booking modals.
- **Files touched**:
  - `frontend/components/timetable-grid.tsx`
  - `frontend/components/timetable-cell.tsx`
- **Estimated effort**: Large

---

### [ ] Task 1.5: Admin Timetable View & Automated Generation (F-04)
- **What to do**:
  - Implement `frontend/app/admin/timetable/page.tsx`.
  - Add filter tabs: Class-wise (CSE-3A, CSE-3B, CSE-5A, CSE-5B), Faculty-wise, and Room-wise.
  - Add primary "Generate Timetable" button that triggers `api.call('generateTimetable', {})`.
  - Add generation summary modal showing: lectures placed, 0 conflicts, unscheduled list with clear explanations.
- **Files touched**:
  - `frontend/app/admin/timetable/page.tsx`
  - `frontend/components/generation-result-dialog.tsx`
- **Estimated effort**: Medium

---

### [ ] Task 1.6: Faculty My Timetable & Mark Leave Flow (F-05)
- **What to do**:
  - Implement `frontend/app/faculty/timetable/page.tsx` showing the faculty member's personal weekly schedule and effective schedule by date.
  - Implement `frontend/app/faculty/leave/page.tsx` (and modal component):
    - Date picker (single date or date range, skipping weekends).
    - Live call to `getLeaveImpact` displaying preview list of affected lectures and lab blocks that will become open slots.
    - Confirm Leave button calling `markLeave`, converting lectures to amber `OPEN` slots in the schedule.
- **Files touched**:
  - `frontend/app/faculty/timetable/page.tsx`
  - `frontend/app/faculty/leave/page.tsx`
  - `frontend/components/leave-impact-dialog.tsx`
- **Estimated effort**: Medium

---

### [ ] Task 1.7: Realtime Notification System & Header Bell (F-06)
- **What to do**:
  - Implement `frontend/lib/use-notifications.ts` hook combining Supabase Realtime table subscription on `notifications` with a 3-second polling fallback to `getNotifications`. Deduplicate notifications by ID.
  - Implement `frontend/components/notification-bell.tsx`:
    - Animated unread counter badge.
    - Dropdown list displaying newest notifications first (`open_slot`, `booking_confirmed`, etc.).
    - Direct action link on open slot notifications opening the slot claim dialog.
    - "Mark as read" interaction calling `markNotificationRead`.
- **Files touched**:
  - `frontend/lib/use-notifications.ts`
  - `frontend/components/notification-bell.tsx`
  - `frontend/components/header.tsx`
- **Estimated effort**: Medium

---

### [ ] Task 1.8: Open Academic Slot Feed & Deterministic 5-Check Booking Modal (F-07, F-08)
- **What to do**:
  - Implement `frontend/app/faculty/open-slots/page.tsx` displaying the feed of currently available Open Academic Slots with recommendation match score badges (0-100).
  - Implement `frontend/components/open-slot-booking-dialog.tsx`:
    - Slot details banner: original faculty, date, slot span (theory 1 slot, lab 2 slots), class, room.
    - Subject selector dropdown listing ONLY the current faculty's eligible subjects (`faculty_subjects`).
    - Live 5-check status cards with pass/fail indicators and explanatory feedback:
      1. Faculty free across all span slots.
      2. Subject eligible and room type compatible.
      3. Class free across span slots.
      4. Room reserved for this open slot.
      5. Workload within `max_hours`.
    - "Confirm Booking" button enabled ONLY when all 5 checks pass.
    - On confirmation: call `bookSlot`, show success notification, and immediately refresh the timetable and workload views.
- **Files touched**:
  - `frontend/app/faculty/open-slots/page.tsx`
  - `frontend/components/open-slot-booking-dialog.tsx`
- **Estimated effort**: Large

---

### [ ] Task 1.9: End-to-End P0 Demo Script Verification & Reset Workflow
- **What to do**:
  - Test and verify the end-to-end 9-step demo flow as outlined in `docs/DEMO_SCRIPT.md`:
    1. Admin -> Timetable -> Click "Generate" -> 0 conflicts.
    2. Admin -> Workload -> All faculty within limits.
    3. Switch to Dr. Sharma -> CSE-3A Friday slot 2 DBMS visible.
    4. Sharma -> Mark Leave for Friday -> Preview affected lectures -> Confirm.
    5. Grid displays amber OPEN slot.
    6. Switch to Prof. Kaur -> Bell lights up -> Open notification -> View slot & score.
    7. Kaur selects Operating Systems -> All 5 checks green -> Confirm.
    8. Timetable shows Operating Systems (Kaur) -> Workload updated -> Admin hours saved incremented.
    9. Reset Demo restores original seed timetable.
- **Files touched**:
  - `frontend/components/demo-banner.tsx`
  - `frontend/app/login/page.tsx`
- **Estimated effort**: Small

---

## Group 2: Should-Have (P1 — Full Management & Reporting)

### [ ] Task 2.1: Faculty Workload Dashboard & Visual Progress Bars (F-09)
- **What to do**:
  - Build `frontend/components/workload-bar.tsx` with color-coded progress (green = ok, amber = under load, red = over max).
  - Implement `frontend/app/admin/workload/page.tsx` displaying all faculty with required, assigned, extra hours, and load status.
  - Implement workload summary card in `frontend/app/faculty/page.tsx`.
- **Files touched**:
  - `frontend/components/workload-bar.tsx`
  - `frontend/app/admin/workload/page.tsx`
  - `frontend/app/faculty/page.tsx`
- **Estimated effort**: Medium

---

### [ ] Task 2.2: Room & Lab Availability Matrix (F-10)
- **What to do**:
  - Implement `frontend/app/admin/rooms/page.tsx` calling `getRoomAvailability(date)`.
  - Render an interactive matrix showing rooms along rows and time slots along columns with free/busy/open states.
- **Files touched**:
  - `frontend/app/admin/rooms/page.tsx`
  - `frontend/components/room-availability-matrix.tsx`
- **Estimated effort**: Medium

---

### [ ] Task 2.3: Admin Open Slots Monitor & Dashboard KPI Cards (F-11)
- **What to do**:
  - Implement `frontend/app/admin/open-slots/page.tsx` tracking open, booked, and cancelled slots.
  - Implement `frontend/app/admin/page.tsx` with dashboard KPI cards calling `getDashboardStats`: total lectures, 0 conflicts, room utilization percentage, open slots filled, and academic hours saved.
- **Files touched**:
  - `frontend/app/admin/page.tsx`
  - `frontend/app/admin/open-slots/page.tsx`
  - `frontend/components/stat-card.tsx`
- **Estimated effort**: Medium

---

### [ ] Task 2.4: Admin Entity Management / Setup CRUD Screens (F-12)
- **What to do**:
  - Implement `frontend/app/admin/setup/page.tsx` with tabs for Faculty, Subjects, Classes, and Rooms.
  - Modal dialogs for viewing and upserting entities using `upsertFaculty`, `upsertSubject`, `upsertClass`, and `upsertRoom`.
- **Files touched**:
  - `frontend/app/admin/setup/page.tsx`
  - `frontend/components/setup-forms.tsx`
- **Estimated effort**: Large

---

### [ ] Task 2.5: Manual Timetable Entry Adjustment & Conflict Warning (F-13)
- **What to do**:
  - Enhance `frontend/app/admin/timetable/page.tsx` with an edit/move dialog.
  - Call `moveTimetableEntry` and display instant hard constraint validation errors or conflict warnings.
  - Display unscheduled lectures tray with placement guidance.
- **Files touched**:
  - `frontend/app/admin/timetable/page.tsx`
  - `frontend/components/move-entry-dialog.tsx`
- **Estimated effort**: Medium

---

### [ ] Task 2.6: Ad-hoc Lab Resource Booking Screen (F-14)
- **What to do**:
  - Implement `frontend/app/faculty/labs/page.tsx` for ad-hoc booking: lab selection, valid 2-slot consecutive block, equipment checklist, purpose.
  - Implement `frontend/app/admin/labs/page.tsx` for reviewing, approving, or rejecting pending lab bookings.
- **Files touched**:
  - `frontend/app/faculty/labs/page.tsx`
  - `frontend/app/admin/labs/page.tsx`
  - `frontend/components/lab-booking-card.tsx`
- **Estimated effort**: Medium

---

### [ ] Task 2.7: PDF Timetable & Workload Report Export (F-15)
- **What to do**:
  - Implement `frontend/lib/pdf.ts` utilizing `jsPDF` and `jspdf-autotable`.
  - "Export PDF" button on Admin and Faculty timetable pages to download clean, printable timetables and faculty workload reports.
- **Files touched**:
  - `frontend/lib/pdf.ts`
  - `frontend/app/admin/timetable/page.tsx`
  - `frontend/app/faculty/timetable/page.tsx`
  - `frontend/app/admin/reports/page.tsx`
- **Estimated effort**: Medium

---

### [ ] Task 2.8: High-Conversion Product Landing Page (F-16)
- **What to do**:
  - Implement `frontend/app/page.tsx`:
    - Hero section with the tagline: *"Do not let a cancelled lecture become a wasted academic hour."*
    - Live stats ticker reading from `getDashboardStats`.
    - 6 feature showcase cards highlighting Open Academic Slots, Conflict Prevention, Dynamic Workload, etc.
    - Quick CTA login buttons.
- **Files touched**:
  - `frontend/app/page.tsx`
- **Estimated effort**: Medium

---

## Group 3: Nice-To-Have (P2 — Analytics & Visualization)

### [x] Task 3.1: Executive Analytics & Heatmaps (F-17)
- **What to do**:
  - Implement `frontend/app/admin/analytics/page.tsx` calling `getAnalytics`.
  - Recharts visualizations: peak-hour room utilization heatmap, open academic slots filled vs. wasted ratio, and cumulative academic hours saved chart.
- **Files touched**:
  - `frontend/app/admin/analytics/page.tsx`
  - `frontend/components/charts/utilization-heatmap.tsx`
  - `frontend/components/charts/hours-saved-chart.tsx`
- **Estimated effort**: Medium
