'use client';

import React from 'react';
import type { TimetableEntry, ScheduleEntry } from '@shared/types';
import { DAYS, TIME_SLOT_DEFS } from '@/mock/demo-timetable';
import { Sparkles, FlaskConical, Clock, DoorOpen, User, BookOpen } from 'lucide-react';

type GridEntry = TimetableEntry | ScheduleEntry;

interface TimetableGridProps {
  entries: GridEntry[];
  onSlotClick?: (entry: GridEntry) => void;
  highlightFacultyId?: string;
}

export function TimetableGrid({
  entries,
  onSlotClick,
  highlightFacultyId,
}: {
  entries: GridEntry[];
  onSlotClick?: (entry: GridEntry) => void;
  highlightFacultyId?: string;
}) {
  // Helper to check if an entry is a ScheduleEntry (effective schedule)
  const isScheduleEntry = (entry: GridEntry): entry is ScheduleEntry => {
    return 'state' in entry;
  };

  // Build grid map: key = `${day}-${slotNo}`
  // Handle lab blocks: lab block takes slot s and s+1
  const gridMap = new Map<string, GridEntry>();
  const skippedSlots = new Set<string>();

  // Sort so first slot of block comes first
  const sorted = [...entries].sort((a, b) => a.slotNo - b.slotNo);

  for (const entry of sorted) {
    const key = `${entry.day}-${entry.slotNo}`;
    if (!gridMap.has(key)) {
      gridMap.set(key, entry);

      // If lab block, mark next slot as skipped for rendering
      const isLab = ('span' in entry && entry.span === 2) || (entry.blockId !== null);
      if (isLab) {
        skippedSlots.add(`${entry.day}-${entry.slotNo + 1}`);
      }
    }
  }

  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-border bg-card shadow-xs">
      <div className="min-w-[840px]">
        {/* Table Header: Days of Week */}
        <div className="grid grid-cols-6 border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">
          <div className="p-3.5 border-r border-border flex items-center justify-center font-bold text-foreground">
            Time Slot
          </div>
          {DAYS.map((d) => (
            <div key={d.day} className="p-3.5 border-r border-border last:border-r-0">
              <span className="text-foreground font-bold">{d.name}</span>
            </div>
          ))}
        </div>

        {/* Rows: Slot 1 to 5, Lunch Break, Slot 6 to 7 */}
        {TIME_SLOT_DEFS.map((slotDef, idx) => {
          const isSlot5 = slotDef.slotNo === 5;
          const isAfterBreak = slotDef.slotNo === 6;

          return (
            <React.Fragment key={slotDef.slotNo}>
              {/* Insert Lunch Break Row right before slot 6 */}
              {isAfterBreak && (
                <div className="grid grid-cols-6 bg-slate-100 border-b border-border text-center text-xs font-semibold text-slate-500 py-2.5 tracking-wider uppercase">
                  <div className="flex items-center justify-center gap-1.5 border-r border-slate-200">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>13:10 – 14:00</span>
                  </div>
                  <div className="col-span-5 flex items-center justify-center gap-2 text-slate-600 font-bold">
                    <span>Lunch Break</span>
                    <span className="text-[10px] font-normal text-slate-400 lowercase">(no academic lectures scheduled)</span>
                  </div>
                </div>
              )}

              {/* Slot Row */}
              <div className="grid grid-cols-6 border-b border-border min-h-[92px]">
                {/* Time Slot Header Column */}
                <div className="p-3 border-r border-border bg-muted/20 flex flex-col justify-center items-center text-center">
                  <span className="text-xs font-bold text-foreground">
                    Slot {slotDef.slotNo}
                  </span>
                  <span className="text-[11px] text-muted-foreground mt-0.5">
                    {slotDef.startTime} – {slotDef.endTime}
                  </span>
                </div>

                {/* Day Columns */}
                {DAYS.map((d) => {
                  const key = `${d.day}-${slotDef.slotNo}`;

                  // If this slot was consumed by a previous lab block spanning 2 slots
                  if (skippedSlots.has(key)) {
                    return null; // Handled by rowSpan on previous cell
                  }

                  const entry = gridMap.get(key);
                  const isLab = entry && (('span' in entry && entry.span === 2) || entry.blockId !== null);

                  if (!entry) {
                    return (
                      <div
                        key={d.day}
                        className="p-2 border-r border-border last:border-r-0 flex items-center justify-center text-xs text-muted-foreground/40 bg-slate-50/30"
                      >
                        —
                      </div>
                    );
                  }

                  // Determine state
                  let state = 'normal';
                  let isOpenSlot = false;
                  let isExtra = false;

                  if (isScheduleEntry(entry)) {
                    state = entry.state;
                    isOpenSlot = entry.state === 'open';
                    isExtra = entry.state === 'extra';
                  }

                  return (
                    <div
                      key={d.day}
                      style={isLab ? { gridRow: `span 2` } : undefined}
                      onClick={() => onSlotClick?.(entry)}
                      className={`p-2.5 border-r border-border last:border-r-0 flex flex-col justify-between transition-all cursor-pointer ${
                        isOpenSlot
                          ? 'bg-amber-50/90 border-2 border-amber-400 shadow-xs hover:bg-amber-100/90'
                          : isExtra
                          ? 'bg-indigo-50/90 border-2 border-indigo-400 shadow-xs hover:bg-indigo-100/90'
                          : 'bg-white hover:bg-slate-50 hover:shadow-xs'
                      }`}
                    >
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-1 mb-1">
                        {isOpenSlot ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500 text-white shadow-xs animate-pulse">
                            <Sparkles className="w-2.5 h-2.5" />
                            OPEN
                          </span>
                        ) : isExtra ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-600 text-white shadow-xs">
                            <Sparkles className="w-2.5 h-2.5" />
                            EXTRA
                          </span>
                        ) : isLab ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                            <FlaskConical className="w-2.5 h-2.5" />
                            LAB (2 slots)
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                            Theory
                          </span>
                        )}

                        <span className="text-[11px] font-bold text-slate-700 truncate">
                          {entry.className}
                        </span>
                      </div>

                      {/* Subject Name */}
                      <div className="my-0.5">
                        <div
                          className={`font-bold text-xs truncate ${
                            isOpenSlot
                              ? 'text-amber-800 italic'
                              : isExtra
                              ? 'text-indigo-900 font-extrabold'
                              : 'text-slate-900'
                          }`}
                        >
                          {isOpenSlot
                            ? 'Open Academic Slot (Click to claim)'
                            : entry.subjectName || 'Unassigned Subject'}
                        </div>
                      </div>

                      {/* Faculty & Room Footer */}
                      <div className="mt-1 pt-1 border-t border-slate-100/80 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1 truncate font-medium text-slate-600">
                          <User className="w-3 h-3 text-slate-400 flex-shrink-0" />
                          <span className="truncate">
                            {isOpenSlot ? 'No Teacher' : entry.facultyName || '—'}
                          </span>
                        </span>
                        <span className="flex items-center gap-1 font-semibold text-slate-500 flex-shrink-0 ml-1">
                          <DoorOpen className="w-3 h-3 text-slate-400" />
                          <span>{entry.roomName}</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
