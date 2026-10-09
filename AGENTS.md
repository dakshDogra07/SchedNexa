# AGENTS.md

## Project summary
Smart Academic Resource Manager: a scheduling platform that decides who teaches what, when and where.
Hackathon project (5 hours, team of 4). Problem statement: Smart Resource Booking, Faculty Load & Timetable Management.
USP: OPEN ACADEMIC SLOT. When a faculty marks leave, the lecture is not deleted. Class, room and time stay reserved as an Open Academic Slot. Eligible faculty are notified, and one of them takes it for THEIR OWN subject after conflict checks pass.
Roles: admin and faculty only.

## Read before any work
- docs/PROJECT.md
- docs/ARCHITECTURE.md
- docs/API_CONTRACT.md
- docs/DATABASE.md
- docs/DESIGN.md (UI only)
- Your own task file: docs/TASKS_FRONTEND.md or docs/TASKS_BACKEND.md

## Rules
1. ONE TASK AT A TIME. Even if 20 tasks are listed, do exactly one. Pick the first unfinished task for your area, mark it [~], finish it and verify it runs, mark it [x], and only then take the next. No "also quickly fix" extras. If unclear or blocked, stop and ask.
2. Do not install packages beyond the stack without asking.
3. Work only inside your own folder (frontend/ or backend/).
4. shared/, docs/API_CONTRACT.md and docs/DATABASE.md are LOCKED. Do not edit them. Write a proposal in docs/DECISIONS.md and stop.
5. Every API function takes ONE object and returns ApiResult<T>. Never change the shape of backend/index.ts or frontend/app/api/rpc.
6. Priority order: P0, then P1, then P2. No features outside the spec. The frontend may use mock data that follows shared/types.ts.
7. Validate input with Zod. Use clear error messages.
8. Update your TASKS file after each task.
9. Never commit .env files.
10. Never break the docs/DEMO_SCRIPT.md flow.
11. Do NOT run git commands. The human handles git.