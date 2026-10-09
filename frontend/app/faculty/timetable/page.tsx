'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getSession } from '@/lib/session';
import { TimetableGrid } from '@/components/timetable-grid';
import type { TimetableEntry, ScheduleEntry } from '@shared/types';
import { Calendar, Layers, Clock, Sparkles, Download } from 'lucide-react';
import { exportTimetableToPdf } from '@/lib/pdf';

export default function FacultyTimetablePage() {
  const [session, setSession] = useState(getSession());
  const [viewMode, setViewMode] = useState<'weekly' | 'effective'>('weekly');
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-16'); // Demo Friday
  const [weeklyEntries, setWeeklyEntries] = useState<TimetableEntry[]>([]);
  const [effectiveEntries, setEffectiveEntries] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTimetable = async () => {
    if (!session?.facultyId) return;
    setLoading(true);

    if (viewMode === 'weekly') {
      const res = await api.call('getTimetable', { facultyId: session.facultyId });
      if (res.ok) setWeeklyEntries(res.data);
    } else {
      const res = await api.call('getEffectiveSchedule', {
        date: selectedDate,
        facultyId: session.facultyId,
      });
      if (res.ok) setEffectiveEntries(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    setSession(getSession());
  }, []);

  useEffect(() => {
    fetchTimetable();
  }, [viewMode, selectedDate, session?.facultyId]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary" />
            My Academic Timetable
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Personal teaching schedule for {session?.name || 'Faculty'}.
          </p>
        </div>

        {/* View Mode Toggle & Date Picker */}
        <div className="flex items-center gap-3">
          <div className="flex bg-muted/60 p-1 rounded-xl border border-border">
            <button
              onClick={() => setViewMode('weekly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                viewMode === 'weekly'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Weekly Template</span>
            </button>
            <button
              onClick={() => setViewMode('effective')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                viewMode === 'effective'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Daily Overlay</span>
            </button>
          </div>

          {viewMode === 'effective' && (
            <div className="flex items-center gap-2 bg-card border border-border px-3 py-1.5 rounded-xl shadow-xs">
              <span className="text-xs text-muted-foreground font-medium">Date:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-xs font-semibold bg-transparent text-foreground focus:outline-hidden"
              />
            </div>
          )}

          <button
            onClick={() => {
              const activeEntries = viewMode === 'weekly' ? weeklyEntries : effectiveEntries;
              exportTimetableToPdf({
                title: `${session?.name || 'Faculty'} - ${viewMode === 'weekly' ? 'Weekly Timetable' : `Schedule (${selectedDate})`}`,
                subtitle: `Department of Computer Science • SchedNexa`,
                entries: activeEntries,
              });
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-card border border-border text-foreground font-semibold text-xs hover:bg-muted transition-all shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-primary" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="p-12 text-center text-sm text-muted-foreground animate-pulse">
          Loading personal timetable...
        </div>
      ) : (
        <TimetableGrid
          entries={viewMode === 'weekly' ? weeklyEntries : effectiveEntries}
          highlightFacultyId={session?.facultyId}
        />
      )}
    </div>
  );
}
