'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { TimetableGrid } from '@/components/timetable-grid';
import type { TimetableEntry, GenerationResult } from '@shared/types';
import {
  Calendar,
  Sparkles,
  Zap,
  CheckCircle2,
  ShieldCheck,
  X,
  RefreshCw,
  Users,
  GraduationCap,
  DoorOpen,
} from 'lucide-react';

const CLASSES = [
  { id: '40000000-0000-0000-0000-000000000001', name: 'CSE-3A' },
  { id: '40000000-0000-0000-0000-000000000002', name: 'CSE-3B' },
  { id: '40000000-0000-0000-0000-000000000003', name: 'CSE-5A' },
  { id: '40000000-0000-0000-0000-000000000004', name: 'CSE-5B' },
];

const FACULTY = [
  { id: '20000000-0000-0000-0000-000000000001', name: 'Dr. Sharma' },
  { id: '20000000-0000-0000-0000-000000000002', name: 'Prof. Kaur' },
  { id: '20000000-0000-0000-0000-000000000003', name: 'Dr. Mehta' },
  { id: '20000000-0000-0000-0000-000000000004', name: 'Dr. Verma' },
  { id: '20000000-0000-0000-0000-000000000005', name: 'Dr. Iyer' },
];

const ROOMS = [
  { id: '50000000-0000-0000-0000-000000000001', name: 'Room 101' },
  { id: '50000000-0000-0000-0000-000000000002', name: 'Room 102' },
  { id: '50000000-0000-0000-0000-000000000003', name: 'Room 103' },
  { id: '50000000-0000-0000-0000-000000000004', name: 'Room 104' },
  { id: '50000000-0000-0000-0000-000000000005', name: 'Lab 1' },
  { id: '50000000-0000-0000-0000-000000000006', name: 'Lab 2' },
];

export default function AdminTimetablePage() {
  const [filterType, setFilterType] = useState<'class' | 'faculty' | 'room'>('class');
  const [selectedId, setSelectedId] = useState<string>(CLASSES[0].id);
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Generator action state
  const [generating, setGenerating] = useState<boolean>(false);
  const [genResult, setGenResult] = useState<GenerationResult | null>(null);

  // Load timetable based on filter
  const fetchTimetable = async (type = filterType, id = selectedId) => {
    setLoading(true);
    const filterInput =
      type === 'class' ? { classId: id } : type === 'faculty' ? { facultyId: id } : { roomId: id };

    const res = await api.call('getTimetable', filterInput);
    if (res.ok) {
      setEntries(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTimetable(filterType, selectedId);
  }, [filterType, selectedId]);

  const handleGenerate = async () => {
    setGenerating(true);
    const res = await api.call('generateTimetable', {});
    setGenerating(false);
    if (res.ok) {
      setGenResult(res.data);
      fetchTimetable();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary" />
            Timetable Management
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Automated conflict-free scheduling and weekly template overview.
          </p>
        </div>

        {/* Generate Timetable Primary CTA Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-all shadow-md shadow-primary/20 disabled:opacity-50"
          >
            <Zap className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
            <span>{generating ? 'Running Greedy Generator...' : 'Generate Timetable'}</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs Bar */}
      <div className="bg-card border border-border p-4 rounded-2xl shadow-xs space-y-3">
        {/* Category Switcher */}
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <button
            onClick={() => {
              setFilterType('class');
              setSelectedId(CLASSES[0].id);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterType === 'class'
                ? 'bg-primary text-white'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Class-wise</span>
          </button>

          <button
            onClick={() => {
              setFilterType('faculty');
              setSelectedId(FACULTY[0].id);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterType === 'faculty'
                ? 'bg-primary text-white'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Faculty-wise</span>
          </button>

          <button
            onClick={() => {
              setFilterType('room');
              setSelectedId(ROOMS[0].id);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterType === 'room'
                ? 'bg-primary text-white'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <DoorOpen className="w-3.5 h-3.5" />
            <span>Room-wise</span>
          </button>
        </div>

        {/* Item Pills */}
        <div className="flex flex-wrap gap-2">
          {filterType === 'class' &&
            CLASSES.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  selectedId === c.id
                    ? 'bg-indigo-100 text-indigo-900 border border-indigo-300 font-bold'
                    : 'bg-muted/40 text-muted-foreground hover:bg-muted border border-transparent'
                }`}
              >
                {c.name}
              </button>
            ))}

          {filterType === 'faculty' &&
            FACULTY.map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedId(f.id)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  selectedId === f.id
                    ? 'bg-indigo-100 text-indigo-900 border border-indigo-300 font-bold'
                    : 'bg-muted/40 text-muted-foreground hover:bg-muted border border-transparent'
                }`}
              >
                {f.name}
              </button>
            ))}

          {filterType === 'room' &&
            ROOMS.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedId(r.id)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  selectedId === r.id
                    ? 'bg-indigo-100 text-indigo-900 border border-indigo-300 font-bold'
                    : 'bg-muted/40 text-muted-foreground hover:bg-muted border border-transparent'
                }`}
              >
                {r.name}
              </button>
            ))}
        </div>
      </div>

      {/* Grid Display */}
      {loading ? (
        <div className="p-12 text-center text-sm text-muted-foreground animate-pulse">
          Loading timetable grid...
        </div>
      ) : (
        <TimetableGrid entries={entries} />
      )}

      {/* Generation Result Modal */}
      {genResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-5 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-primary font-bold text-base">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span>Timetable Generation Completed</span>
              </div>
              <button
                onClick={() => setGenResult(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Greedy scheduler placed all lectures respecting classroom capacity, lab block integrity, and teacher workload limits.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="text-[11px] font-semibold text-slate-500 uppercase">
                  Lectures Placed
                </div>
                <div className="text-xl font-extrabold text-slate-900 mt-0.5">
                  {genResult.lecturesPlaced}
                </div>
              </div>

              <div className="p-3 bg-green-50 rounded-xl border border-green-200/80">
                <div className="text-[11px] font-semibold text-green-700 uppercase flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Conflicts
                </div>
                <div className="text-xl font-extrabold text-green-800 mt-0.5">
                  {genResult.conflicts}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="text-[11px] font-semibold text-slate-500 uppercase">
                  Unscheduled
                </div>
                <div className="text-xl font-extrabold text-slate-900 mt-0.5">
                  {genResult.unscheduled.length}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="text-[11px] font-semibold text-slate-500 uppercase">
                  Full Load Faculty
                </div>
                <div className="text-xl font-extrabold text-slate-900 mt-0.5">
                  {genResult.facultyAtFullLoad}
                </div>
              </div>
            </div>

            <button
              onClick={() => setGenResult(null)}
              className="w-full py-2.5 bg-primary text-white rounded-xl text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm"
            >
              Close & View Timetable
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
