/**
 * engine/workload.ts — PURE faculty workload calculations.
 *
 * No DB calls. Takes numeric parameters and returns WorkloadRow / status.
 *
 * Rules (from PROJECT.md):
 * - assigned_hours = count of timetable rows for faculty (lab block = 2 rows = 2 hours)
 * - extra_hours = sum of span over confirmed extra_lectures that week
 * - total_hours = assigned_hours + extra_hours
 * - Status:
 *   - 'under' if assigned_hours < required_hours
 *   - 'ok' if between required_hours and max_hours (assigned_hours >= required_hours and total_hours <= max_hours)
 *   - 'over' if total_hours > max_hours
 */

import type { WorkloadRow, WorkloadStatus } from '@shared/types';

export function computeWorkloadStatus(
  requiredHours: number,
  assignedHours: number,
  totalHours: number,
  maxHours: number
): WorkloadStatus {
  if (totalHours > maxHours) {
    return 'over';
  }
  if (assignedHours < requiredHours) {
    return 'under';
  }
  return 'ok';
}

export function buildWorkloadRow(params: {
  facultyId: string;
  facultyName: string;
  requiredHours: number;
  assignedHours: number;
  extraHours: number;
  maxHours: number;
}): WorkloadRow {
  const { facultyId, facultyName, requiredHours, assignedHours, extraHours, maxHours } = params;
  const totalHours = assignedHours + extraHours;
  const status = computeWorkloadStatus(requiredHours, assignedHours, totalHours, maxHours);

  return {
    facultyId,
    facultyName,
    requiredHours,
    assignedHours,
    extraHours,
    totalHours,
    maxHours,
    status,
  };
}
