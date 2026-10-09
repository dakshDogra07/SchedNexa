# PROPOSALS (Frontend)

---

### P-001 | Node.js / npm Environment Requirement | status: proposed
- **Author**: frontend
- **Task**: F-01
- **File affected**: System environment / runtime
- **Problem**:
  Neither `node` nor `npm` is installed or present in `PATH` on the operating system.
  Per strict write permissions rule 3: *"Do not install global packages, change git history, or run commands that affect files outside frontend/. Ask me first if you think something outside is needed."*
  We cannot run `npm install`, `npx tsc`, or dev server commands without Node.js available.
- **Proposed change**:
  The user can install Node.js LTS (e.g. via `winget install OpenJS.NodeJS.LTS` or from nodejs.org) so that `node` and `npm` are available in PowerShell.
- **Impact**: Enables running `npm install` and local server inside `frontend/`.

---

### P-002 | Compilation of app/api/rpc/[fn]/route.ts without backend/index.ts | status: proposed
- **Author**: frontend
- **Task**: F-01
- **File affected**: `frontend/app/api/rpc/[fn]/route.ts`
- **Problem**:
  `docs/ARCHITECTURE.md` specifies that `app/api/rpc/[fn]/route.ts` directly imports `handlers` from `@backend/index` (`../backend/index`).
  However, `backend/index.ts` does not exist on disk yet and belongs to another engineer.
  Static import `import { handlers } from '@backend/index'` causes TypeScript/bundlers to report:
  `Cannot find module '@backend/index' or its corresponding type declarations.`
  Per strict task instructions: *"Write the rpc route exactly as docs/ARCHITECTURE.md describes. If it cannot compile without backend/index.ts, report that as a blocker instead of working around it."*
- **Proposed change**:
  Option A: Provide a minimal ambient module declaration `frontend/types/backend.d.ts` declaring module `'@backend/index'` with handlers typed to `ApiContract`, so `tsc` compiles cleanly while keeping `route.ts` identical to `docs/ARCHITECTURE.md`.
  Option B: Wait for backend engineer to deliver task B-01 (`backend/index.ts`).
- **Impact**: Allows `npm run build` and `tsc` to succeed before backend delivery while `NEXT_PUBLIC_USE_MOCK=true` handles all UI calls.
