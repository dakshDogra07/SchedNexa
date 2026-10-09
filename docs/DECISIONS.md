# DECISIONS

Proposals for changes to LOCKED files (shared/, docs/API_CONTRACT.md, docs/DATABASE.md). Write a proposal here and stop. The human decides.

## Proposal format

### D-001 | <short title> | status: proposed | accepted | rejected
- Author: <frontend | backend>
- Task: <task ID>
- Locked file affected: <path>
- Problem: <what blocks the task>
- Proposed change: <exact change>
- Impact: <who must update what>
- Decision (human): <blank until decided>

## Example

### D-000 | Example: add index on timetable.faculty_id | status: proposed
- Author: backend
- Task: B-10
- Locked file affected: shared/schema.sql
- Problem: getWorkload is slow on large timetables.
- Proposed change: CREATE INDEX timetable_faculty_id_idx ON timetable (faculty_id);
- Impact: backend re-runs schema.sql on a fresh database. No type changes.
- Decision (human):

## Log
(none yet)