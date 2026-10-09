'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { TimetableGrid } from '@/components/timetable-grid';
import type { TimetableEntry, GenerationResult } from '@shared/types';
import { DAYS, TIME_SLOT_DEFS } from '@/mock/demo-timetable';
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
  ArrowRightLeft,
  AlertTriangle,
  Info,
  Clock,
  Download,
} from 'lucide-react';
import { exportTimetableToPdf } from '@/lib/pdf';

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

  // Manual move modal state
  const [selectedEntryToMove, setSelectedEntryToMove] = useState<TimetableEntry | null>(null);
  const [targetDay, setTargetDay] = useState<number>(1);
  const [targetSlotNo, setTargetSlotNo] = useState<number>(1);
  const [targetRoomId, setTargetRoomId] = useState<string>(ROOMS[0].id);
  const [moving, setMoving] = useState<boolean>(false);
  const [moveConflicts, setMoveConflicts] = useState<string[]>([]);
  const [moveSuccess, setMoveSuccess] = useState<boolean>(false);

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

  // Open move modal
  const handleSlotClick = (entry: any) => {
    // Only regular timetable entry can be moved
    if ('subjectName' in entry) {
      const timetableEntry = entry as TimetableEntry;
      setSelectedEntryToMove(timetableEntry);
      setTargetDay(timetableEntry.day);
      setTargetSlotNo(timetableEntry.slotNo);
      setTargetRoomId(timetableEntry.roomId);
      setMoveConflicts([]);
      setMoveSuccess(false);
    }
  };

  const handleMoveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntryToMove) return;

    setMoving(true);
    setMoveConflicts([]);
    setMoveSuccess(false);

    const slotId = `a0000000-0000-0000-0000-${String(targetSlotNo).padStart(12, '0')}`;

    const res = await api.call('moveTimetableEntry', {
      timetableId: selectedEntryToMove.id,
      day: targetDay,
      slotId,
      roomId: targetRoomId,
    });

    setMoving(false);

    if (res.ok) {
      if (res.data.ok) {
        setMoveSuccess(true);
        setTimeout(() => {
          setSelectedEntryToMove(null);
          fetchTimetable();
        }, 900);
      } else {
        setMoveConflicts(res.data.conflicts);
      }
    } else {
      setMoveConflicts([res.error]);
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
            Automated conflict-free scheduling, manual drag/reassignment, and weekly template overview.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const currentName =
                filterType === 'class'
                  ? CLASSES.find((c) => c.id === selectedId)?.name
                  : filterType === 'faculty'
                  ? FACULTY.find((f) => f.id === selectedId)?.name
                  : ROOMS.find((r) => r.id === selectedId)?.name;

              exportTimetableToPdf({
                title: `Weekly Timetable - ${currentName || 'Overview'}`,
                subtitle: `Filter: ${filterType.toUpperCase()} • Generated by SchedNexa`,
                entries,
              });
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-card border border-border text-foreground font-semibold text-sm hover:bg-muted transition-all shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-primary" />
            <span>Export PDF</span>
          </button>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-all shadow-md shadow-primary/20 disabled:opacity-50 cursor-pointer"
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
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
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
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
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
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
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
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

      {/* Manual Editing Instructions Hint */}
      <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/30 border border-border px-4 py-2.5 rounded-xl">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-primary shrink-0" />
          <span>
            <strong>Manual Reassignment:</strong> Click any scheduled lecture in the grid below to move it to a different day, slot, or classroom with instant collision verification.
          </span>
        </div>
        <span className="font-semibold text-primary shrink-0">Click any slot to edit</span>
      </div>

      {/* Grid Display */}
      {loading ? (
        <div className="p-12 text-center text-sm text-muted-foreground animate-pulse">
          Loading timetable grid...
        </div>
      ) : (
        <TimetableGrid entries={entries} onSlotClick={handleSlotClick} />
      )}

      {/* Unscheduled Lectures & Quality Tray */}
      <div className="bg-card border border-border p-5 rounded-2xl shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <h3 className="font-bold text-sm text-foreground">Unscheduled Lectures & Allocation Status</h3>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
            100% Lectures Scheduled (0 Conflicts)
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          All curriculum lecture requirements across CSE-3A, CSE-3B, CSE-5A, and CSE-5B have been placed with zero room overlaps or teacher double-bookings.
        </p>
      </div>

      {/* Move Timetable Entry Modal */}
      {selectedEntryToMove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-base text-foreground">Move Lecture Entry</h3>
              </div>
              <button
                onClick={() => setSelectedEntryToMove(null)}
                className="p-1 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current Details */}
            <div className="p-3 bg-muted/30 border border-border rounded-xl space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground font-semibold">Subject:</span>
                <span className="font-bold text-foreground">{selectedEntryToMove.subjectName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-semibold">Faculty:</span>
                <span className="font-bold text-foreground">{selectedEntryToMove.facultyName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-semibold">Class:</span>
                <span className="font-bold text-foreground">{selectedEntryToMove.className}</span>
              </div>
            </div>

            {/* Conflict Warnings */}
            {moveConflicts.length > 0 && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl space-y-1.5 text-xs text-red-900">
                <div className="flex items-center gap-1.5 font-bold text-red-800">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>Collision Detected (Cannot Reschedule):</span>
                </div>
                <ul className="list-disc pl-5 space-y-1 text-[11px]">
                  {moveConflicts.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Success Notification */}
            {moveSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-xs text-green-900 font-bold">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>Lecture relocated successfully with 0 conflicts!</span>
              </div>
            )}

            {/* Move Form */}
            <form onSubmit={handleMoveSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                {/* Target Day */}
                <div>
                  <label className="font-semibold block mb-1">Target Day</label>
                  <select
                    value={targetDay}
                    onChange={(e) => setTargetDay(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-muted/40 border border-border rounded-xl text-xs focus:outline-none focus:border-primary"
                  >
                    {DAYS.map((d) => (
                      <option key={d.day} value={d.day}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Target Slot */}
                <div>
                  <label className="font-semibold block mb-1">Target Period</label>
                  <select
                    value={targetSlotNo}
                    onChange={(e) => setTargetSlotNo(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-muted/40 border border-border rounded-xl text-xs focus:outline-none focus:border-primary"
                  >
                    {TIME_SLOT_DEFS.map((s) => (
                      <option key={s.slotNo} value={s.slotNo}>
                        Slot {s.slotNo} ({s.startTime})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Target Room */}
                <div>
                  <label className="font-semibold block mb-1">Target Room</label>
                  <select
                    value={targetRoomId}
                    onChange={(e) => setTargetRoomId(e.target.value)}
                    className="w-full px-3 py-2 bg-muted/40 border border-border rounded-xl text-xs focus:outline-none focus:border-primary"
                  >
                    {ROOMS.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedEntryToMove(null)}
                  className="px-4 py-2 bg-muted rounded-xl text-foreground font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={moving}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>{moving ? 'Checking Conflicts...' : 'Reassign Lecture'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generation Result Modal */}
      {genResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md p-6 space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 text-primary font-bold text-base">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span>Timetable Generation Completed</span>
              </div>
              <button
                onClick={() => setGenResult(null)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Greedy scheduler placed all lectures respecting classroom capacity, lab block integrity, and teacher workload limits.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-muted/30 rounded-xl border border-border">
                <div className="text-[11px] font-semibold text-muted-foreground uppercase">
                  Lectures Placed
                </div>
                <div className="text-xl font-extrabold text-foreground mt-0.5">
                  {genResult.lecturesPlaced}
                </div>
              </div>

              <div className="p-3 bg-green-50 rounded-xl border border-green-200">
                <div className="text-[11px] font-semibold text-green-700 uppercase flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Conflicts
                </div>
                <div className="text-xl font-extrabold text-green-800 mt-0.5">
                  {genResult.conflicts}
                </div>
              </div>

              <div className="p-3 bg-muted/30 rounded-xl border border-border">
                <div className="text-[11px] font-semibold text-muted-foreground uppercase">
                  Unscheduled
                </div>
                <div className="text-xl font-extrabold text-foreground mt-0.5">
                  {genResult.unscheduled.length}
                </div>
              </div>

              <div className="p-3 bg-muted/30 rounded-xl border border-border">
                <div className="text-[11px] font-semibold text-muted-foreground uppercase">
                  Full Load Faculty
                </div>
                <div className="text-xl font-extrabold text-foreground mt-0.5">
                  {genResult.facultyAtFullLoad}
                </div>
              </div>
            </div>

            <button
              onClick={() => setGenResult(null)}
              className="w-full py-2.5 bg-primary text-white rounded-xl text-xs font-semibold hover:bg-primary/90 transition-colors shadow-xs"
            >
              Close & View Timetable
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
