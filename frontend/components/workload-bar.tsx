'use client';

import React from 'react';
import type { WorkloadRow } from '@shared/types';
import { CheckCircle2, AlertTriangle, AlertOctagon, User } from 'lucide-react';

interface WorkloadBarProps {
  row: WorkloadRow;
  showFacultyName?: boolean;
}

export function WorkloadBar({ row, showFacultyName = true }: WorkloadBarProps) {
  const {
    facultyName,
    requiredHours,
    assignedHours,
    extraHours,
    totalHours,
    maxHours,
    status,
  } = row;

  // Scale progress bar out of maxHours + buffer (e.g. 26 hrs)
  const scaleMax = Math.max(maxHours + 2, totalHours + 2);
  const assignedPct = Math.min(100, (assignedHours / scaleMax) * 100);
  const extraPct = Math.min(100 - assignedPct, (extraHours / scaleMax) * 100);
  const requiredMarkerPct = (requiredHours / scaleMax) * 100;
  const maxMarkerPct = (maxHours / scaleMax) * 100;

  const getStatusBadge = () => {
    switch (status) {
      case 'ok':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-green-100 text-green-800 border border-green-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
            Optimal Load (OK)
          </span>
        );
      case 'under':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Under Target
          </span>
        );
      case 'over':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200">
            <AlertOctagon className="w-3.5 h-3.5 text-red-600" />
            Limit Exceeded
          </span>
        );
    }
  };

  const getBarColor = () => {
    switch (status) {
      case 'ok':
        return 'bg-green-600';
      case 'under':
        return 'bg-amber-500';
      case 'over':
        return 'bg-red-600';
    }
  };

  return (
    <div className="bg-card border border-border p-5 rounded-2xl shadow-xs space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        {showFacultyName ? (
          <div className="flex items-center gap-2 font-bold text-sm text-foreground">
            <User className="w-4 h-4 text-primary" />
            <span>{facultyName}</span>
          </div>
        ) : (
          <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
            Workload Distribution
          </span>
        )}
        {getStatusBadge()}
      </div>

      {/* Progress Bar with markers */}
      <div className="space-y-1.5">
        <div className="relative h-4 w-full bg-muted/60 rounded-full overflow-hidden flex">
          {/* Base Assigned Hours */}
          <div
            style={{ width: `${assignedPct}%` }}
            className={`h-full transition-all duration-500 ${getBarColor()}`}
            title={`Assigned Hours: ${assignedHours} hrs`}
          />

          {/* Extra Lecture Hours (distinct striped/indigo styling) */}
          {extraHours > 0 && (
            <div
              style={{ width: `${extraPct}%` }}
              className="h-full bg-indigo-500 transition-all duration-500 opacity-90"
              title={`Extra Lectures: ${extraHours} hrs`}
            />
          )}

          {/* Target marker */}
          <div
            style={{ left: `${requiredMarkerPct}%` }}
            className="absolute top-0 bottom-0 w-0.5 bg-slate-900/40 z-10"
            title={`Required: ${requiredHours} hrs`}
          />

          {/* Max marker */}
          <div
            style={{ left: `${maxMarkerPct}%` }}
            className="absolute top-0 bottom-0 w-0.5 bg-red-800/40 z-10"
            title={`Max: ${maxHours} hrs`}
          />
        </div>

        {/* Marker legend below bar */}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground px-0.5">
          <span>0 hrs</span>
          <span className="text-slate-600 font-semibold">Target: {requiredHours} hrs</span>
          <span className="text-red-700 font-semibold">Max: {maxHours} hrs</span>
        </div>
      </div>

      {/* Numerical Metrics Summary */}
      <div className="grid grid-cols-4 gap-2 pt-2 border-t border-border text-center text-xs">
        <div className="p-2 bg-muted/30 rounded-xl">
          <span className="text-[10px] text-muted-foreground uppercase block font-semibold">
            Assigned
          </span>
          <span className="font-bold text-foreground text-sm">{assignedHours} hrs</span>
        </div>

        <div className="p-2 bg-indigo-50/60 rounded-xl border border-indigo-100">
          <span className="text-[10px] text-indigo-700 uppercase block font-bold">
            Extra Slots
          </span>
          <span className="font-bold text-indigo-900 text-sm">+{extraHours} hrs</span>
        </div>

        <div className="p-2 bg-muted/30 rounded-xl">
          <span className="text-[10px] text-muted-foreground uppercase block font-semibold">
            Total
          </span>
          <span className="font-extrabold text-foreground text-sm">{totalHours} hrs</span>
        </div>

        <div className="p-2 bg-muted/30 rounded-xl">
          <span className="text-[10px] text-muted-foreground uppercase block font-semibold">
            Capacity
          </span>
          <span className="font-bold text-muted-foreground text-sm">
            {maxHours - totalHours} hrs left
          </span>
        </div>
      </div>
    </div>
  );
}
