# ARCHITECTURE

## Overview
One Next.js app (App Router, TypeScript, Tailwind, shadcn/ui) in frontend/ that imports pure TypeScript logic from backend/ and types from shared/. No separate server. Data in Supabase Postgres.

## Stack (install nothing else)
Next.js, TypeScript, Tailwind, shadcn/ui, Supabase (Postgres, Realtime), Zod, Recharts, jsPDF + jspdf-autotable. Do NOT use Zustand.

## Call flow

Browser UI -> frontend/lib/api.ts -> POST /api/rpc/<functionName>
-> backend/index.ts (handlers registry)
-> backend/services (DB) + backend/engine (pure logic) -> Supabase


## Folder structure

frontend/ Next.js app
app/page.tsx landing
app/login/
app/admin/ dashboard, setup, timetable, workload, rooms, open-slots, reports
app/faculty/ dashboard, timetable, leave, open-slots, labs, notifications
app/api/rpc/[fn]/route.ts LOCKED generic dispatcher
components/ ui/ (shadcn), timetable-grid.tsx, workload-bar.tsx ...
lib/ api.ts, session.ts, supabase-browser.ts, pdf.ts
mock/ mock data + handlers following shared/types.ts
backend/ own package.json (zod, @supabase/supabase-js)
index.ts LOCKED shape: exports handlers
schemas.ts Zod input schema per function
engine/ PURE: generator.ts conflicts.ts recommend.ts workload.ts availability.ts
services/ DB + orchestration: timetable leave slots booking rooms labs notifications setup demo
lib/ db.ts (server Supabase client), dates.ts
scripts/ tsx test scripts for engine
shared/ LOCKED contract: types.ts schema.sql seed.sql
docs/ all .md files
AGENTS.md


## How frontend and backend are forced to match
```ts
// shared/types.ts
export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };
export type ApiContract = {
  markLeave: { input: { facultyId: string; dateFrom: string; dateTo: string; reason?: string }; output: OpenSlot[] };
  // ... one entry per function in docs/API_CONTRACT.md
};
// backend/index.ts must satisfy the type, so a wrong/missing name = compile error
export const handlers: {
  [K in keyof ApiContract]: (input: unknown) => Promise<ApiResult<ApiContract[K]['output']>>
} = { markLeave, /* ... */ };
// frontend/lib/api.ts exposes typed api.call('markLeave', {...}) built from ApiContract.
// If NEXT_PUBLIC_USE_MOCK=true, api.call answers from frontend/mock instead.
```

## Rules
- Every function takes ONE object argument and returns ApiResult<T>. Never throw to the client. Catch and return {ok:false, error} with a readable message.
- Every function validates input with its Zod schema first.
- Dates are YYYY-MM-DD strings. Weekday is computed in UTC in backend/lib/dates.ts. Ids are uuid strings.
- Conflict logic lives ONLY in engine/conflicts.ts. Services and UI never re-implement checks.
- Frontend never reads Supabase tables directly, except the realtime subscription to notifications.
- The API name, its key in handlers, its ApiContract entry and its API_CONTRACT.md entry are the SAME string.
- Naming: DB columns snake_case; variables/functions camelCase; types/components PascalCase; files kebab-case.
- 'faculty_id' everywhere means faculty_profiles.id, NOT users.id.

## Notifications
- Backend inserts rows in notifications.
- Frontend hook useNotifications(userId) subscribes to Supabase Realtime on notifications AND polls getNotifications every 3 seconds as fallback. Dedupe by id.
- Realtime enabled on: notifications, open_slots, extra_lectures.

## Auth (demo-level)
Pick Admin / Dr. Sharma / Prof. Kaur. Session {userId, role, facultyId} in a cookie. Layout guards check role. Server does not verify identity. No RLS.

## Environment variables (frontend/.env.local, never committed)
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY (server only)
- NEXT_PUBLIC_USE_MOCK

## Wiring (done once first, then locked)
- tsconfig paths: @/* -> frontend, @shared/* -> ../shared/*, @backend/* -> ../backend/*
- next.config: experimental.externalDir = true
- npm install in both frontend/ and backend/
- Smoke test: a ping handler called through api.call plus a real read of time_slots
- Vercel root directory = frontend with "include source files outside root directory" enabled

## Integration
Dev branch, human: set NEXT_PUBLIC_USE_MOCK=false and run the full docs/DEMO_SCRIPT.md. Repeat after every merge.