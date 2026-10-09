You are the BACKEND engineer on this project. Work only inside backend/.

First read, in this order: AGENTS.md, docs/PROJECT.md, docs/ARCHITECTURE.md, docs/API_CONTRACT.md, docs/DATABASE.md, docs/TASKS_BACKEND.md. Do not read docs/DESIGN.md.

Then do exactly ONE task: the first unfinished task in docs/TASKS_BACKEND.md. Mark it [~], finish it, verify it runs, mark it [x] in docs/TASKS_BACKEND.md, and STOP. Do not start the next task.

Rules: follow AGENTS.md exactly. shared/, docs/API_CONTRACT.md and docs/DATABASE.md are LOCKED. If something blocks you, write a proposal in docs/DECISIONS.md and stop. Do not install packages beyond the stack. Do not create any other task or plan files. Do not run git commands. Names must come only from the docs.

When done, reply with: the task ID, what you changed, how you verified it, and any blocker.

# TASKS_BACKEND

Format: `- [ ] ID | Priority | description | needs`
Status: [ ] todo, [~] in progress, [x] done. Exactly ONE task at a time.

- [x] B-01 | P0 | Backend package, db.ts, handlers registry with ping, read time_slots | needs: shared/types.ts
- [x] B-02 | P0 | Run schema.sql + base seed; verify counts | needs: B-01, shared/schema.sql, shared/seed.sql
- [x] B-03 | P0 | engine/availability.ts + engine/conflicts.ts (5 checks, span aware) + script test | needs: B-01
- [x] B-04 | P0 | engine/generator.ts greedy (labs first) + script: 0 conflicts on seed | needs: B-03
- [x] B-05 | P0 | services/timetable: generateTimetable, getTimetable, getEffectiveSchedule | needs: B-02, B-04
- [x] B-06 | P0 | services/leave: getLeaveImpact, markLeave (open slots + notifications) | needs: B-03, B-05
- [x] B-07 | P0 | services/slots: getOpenSlots, checkConflicts, bookSlot | needs: B-03, B-06
- [x] B-08 | P0 | services/notifications: getNotifications, markNotificationRead | needs: B-02
- [x] B-09 | P0 | resetDemo + fixed demo timetable seed | needs: B-02, B-05
- [x] B-10 | P1 | engine/workload.ts + getWorkload | needs: B-02
- [x] B-11 | P1 | getRoomAvailability | needs: B-03, B-05
- [x] B-12 | P1 | setup list/upsert functions | needs: B-02
- [x] B-13 | P1 | engine/recommend.ts + getRecommendations | needs: B-03, B-10
- [x] B-14 | P1 | moveTimetableEntry with validation | needs: B-03, B-05
- [x] B-15 | P1 | lab bookings (create, list, decide) | needs: B-03, B-08
- [x] B-16 | P1 | getDashboardStats | needs: B-05, B-07
- [x] B-17 | P2 | getAnalytics | needs: B-16

Integration (dev branch, human): set NEXT_PUBLIC_USE_MOCK=false and run the full docs/DEMO_SCRIPT.md; repeat after every merge.