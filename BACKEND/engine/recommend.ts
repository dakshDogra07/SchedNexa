/**
 * engine/recommend.ts — Pure rule-based faculty recommendation engine.
 *
 * Scoring rules (total max 100 points, explainable & deterministic):
 *   1. Available (+30): Faculty is free during all slots of the open slot span.
 *   2. Can teach (+30): Faculty teaches an eligible subject for this class and room.
 *   3. No conflict (+20): All 5 live conflict checks pass for an eligible subject.
 *   4. Class/semester suitable (+10): Faculty teaches subjects in the class's semester or department.
 *   5. Workload below target (+10): Current assigned workload < required hours.
 */

import type { Recommendation } from '@shared/types';

export type FacultyEvalContext = {
  facultyId: string;
  facultyName: string;
  isAvailable: boolean;
  canTeachEligibleSubject: boolean;
  hasNoConflicts: boolean;
  isSemesterSuitable: boolean;
  isWorkloadBelowTarget: boolean;
};

/**
 * Pure function to compute recommendation score and reasons for a single faculty candidate.
 */
export function calculateFacultyRecommendation(ctx: FacultyEvalContext): Recommendation {
  let score = 0;
  const reasons: string[] = [];

  // 1. Available (+30)
  if (ctx.isAvailable) {
    score += 30;
    reasons.push('Available during requested time slot (+30)');
  } else {
    reasons.push('Scheduling conflict / unavailable at this time (+0)');
  }

  // 2. Can teach (+30)
  if (ctx.canTeachEligibleSubject) {
    score += 30;
    reasons.push('Teaches subject eligible for this class and room type (+30)');
  } else {
    reasons.push('Does not teach an eligible subject for this class (+0)');
  }

  // 3. No conflict (+20)
  if (ctx.hasNoConflicts) {
    score += 20;
    reasons.push('Passes all 5 deterministic conflict & workload checks (+20)');
  } else {
    reasons.push('Failed one or more live conflict checks (+0)');
  }

  // 4. Class/semester suitable (+10)
  if (ctx.isSemesterSuitable) {
    score += 10;
    reasons.push('Teaches subjects in the class semester/department (+10)');
  } else {
    reasons.push('Does not teach in this class semester/department (+0)');
  }

  // 5. Workload below target (+10)
  if (ctx.isWorkloadBelowTarget) {
    score += 10;
    reasons.push('Current assigned workload is below required target (+10)');
  } else {
    reasons.push('Workload meets or exceeds required target (+0)');
  }

  return {
    facultyId: ctx.facultyId,
    facultyName: ctx.facultyName,
    score,
    reasons,
  };
}
