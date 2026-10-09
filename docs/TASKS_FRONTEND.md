You are the FRONTEND engineer on this project. Work only inside frontend/.

First read, in this order: AGENTS.md, docs/PROJECT.md, docs/ARCHITECTURE.md, docs/API_CONTRACT.md, docs/DATABASE.md, docs/DESIGN.md, docs/TASKS_FRONTEND.md.

Then do exactly ONE task: the first unfinished task in docs/TASKS_FRONTEND.md. Mark it [~], finish it, verify it runs, mark it [x] in docs/TASKS_FRONTEND.md, and STOP. Do not start the next task.

Use mock data (NEXT_PUBLIC_USE_MOCK=true) that follows shared/types.ts until the backend task for that screen is done. Use shadcn/ui only. Follow AGENTS.md exactly. shared/, docs/API_CONTRACT.md and docs/DATABASE.md are LOCKED. If something blocks you, write a proposal in docs/DECISIONS.md and stop. Do not install packages beyond the stack. Do not create any other task or plan files. Do not run git commands.

When done, reply with: the task ID, what you changed, how you verified it, and any blocker.

# TASKS_FRONTEND

Format: `- [ ] ID | Priority | description | needs`
Status: [ ] todo, [~] in progress, [x] done. Exactly ONE task at a time.
Use mock data (NEXT_PUBLIC_USE_MOCK=true) following shared/types.ts until the backend task is done.

- [ ] F-01 | P0 | Wiring: tsconfig paths, api.ts, rpc route, mock mode, ping page | needs: shared/types.ts, B-01 (real mode)
- [ ] F-02 | P0 | App shell, sidebars, demo login page, session cookie, route guards | needs: F-01
- [ ] F-03 | P0 | TimetableGrid component (7 slots x 5 days, break row, lab blocks span 2) | needs: F-01
- [ ] F-04 | P0 | Admin timetable page: Generate button, result panel, class/faculty/room tabs | needs: F-02, F-03, B-05 (real mode)
- [ ] F-05 | P0 | Faculty Mark Leave page: impact preview + confirm | needs: F-02, B-06 (real mode)
- [ ] F-06 | P0 | Notification bell + useNotifications (realtime + polling) | needs: F-02, B-08 (real mode)
- [ ] F-07 | P0 | Faculty open slots feed + booking screen with live 5-check list | needs: F-03, F-06, B-07 (real mode)
- [ ] F-08 | P0 | Confirm booking -> refresh timetable and workload | needs: F-04, F-07
- [ ] F-09 | P1 | Workload dashboard with progress bars | needs: F-02, B-10 (real mode)
- [ ] F-10 | P1 | Room availability grid | needs: F-02, B-11 (real mode)
- [ ] F-11 | P1 | Admin open-slots monitor + dashboard stats | needs: F-02, B-16 (real mode)
- [ ] F-12 | P1 | Setup screens | needs: F-02, B-12 (real mode)
- [ ] F-13 | P1 | Manual edit with conflict warning + unscheduled list | needs: F-04, B-14 (real mode)
- [ ] F-14 | P1 | Lab booking page | needs: F-02, B-15 (real mode)
- [ ] F-15 | P1 | PDF export (jsPDF + autotable) | needs: F-04, F-09
- [ ] F-16 | P1 | Landing page | needs: F-01, B-16 (real mode)
- [ ] F-17 | P2 | Analytics charts (Recharts) | needs: F-11, B-17 (real mode)