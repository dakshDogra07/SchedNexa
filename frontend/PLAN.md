# PLAN: F-07 & F-08 - Open Slots Feed, Live 5-Check Booking Modal & Confirmation Flow

**Task ID**: F-07 & F-08  
**Goal**: Build the Faculty Open Slots feed displaying available slots with recommendation match score badges, the interactive booking dialog with live 5-check deterministic validation, and the booking confirmation flow that updates timetable and workload in real-time.  
**STATUS**: [x] done (Open slots feed, live 5 checks dialog, booking confirmation, and timetable integration verified)  

---

## Numbered Checklist of Sub-Steps
1. [x] Update `frontend/PLAN.md` to F-07 & F-08 with status.
2. [x] Update `frontend/mock/handlers.ts` to implement realistic `getOpenSlots`, `getRecommendations`, `checkConflicts`, and `bookSlot` handlers.
3. [x] Implement `frontend/components/open-slot-booking-dialog.tsx` displaying slot metadata, subject picker, live 5-point check cards, and Confirm button.
4. [x] Implement `frontend/app/faculty/open-slots/page.tsx` displaying the active feed of Open Academic Slots with recommendation scores and Claim button.
5. [x] Connect booking confirmation to refresh timetable and workload state.
6. [x] Verify complete end-to-end Demo Flow (HTTP 200 OK across all pages).
7. [x] Update `STATUS` in `frontend/PLAN.md` to [x].
