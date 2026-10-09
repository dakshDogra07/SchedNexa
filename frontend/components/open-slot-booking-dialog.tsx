'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import type { OpenSlotView, CheckResult } from '@shared/types';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  DoorOpen,
  GraduationCap,
  User,
  Check,
  X,
  BookOpen,
} from 'lucide-react';

interface OpenSlotBookingDialogProps {
  slot: OpenSlotView;
  facultyId: string;
  facultyName: string;
  onClose: () => void;
  onBooked: () => void;
}

// Eligible subjects for demo faculty
const KAUR_SUBJECTS = [
  { id: '30000000-0000-0000-0000-000000000007', name: 'Operating Systems', code: 'CS501', type: 'theory' },
  { id: '30000000-0000-0000-0000-000000000009', name: 'Software Engineering', code: 'CS503', type: 'theory' },
];

export function OpenSlotBookingDialog({
  slot,
  facultyId,
  facultyName,
  onClose,
  onBooked,
}: OpenSlotBookingDialogProps) {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(KAUR_SUBJECTS[0].id);
  const [checks, setChecks] = useState<CheckResult | null>(null);
  const [loadingChecks, setLoadingChecks] = useState<boolean>(true);
  const [booking, setBooking] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  // Re-run the 5 checks when selectedSubjectId changes
  useEffect(() => {
    async function runChecks() {
      setLoadingChecks(true);
      setError(null);
      const res = await api.call('checkConflicts', {
        openSlotId: slot.id,
        facultyId,
        subjectId: selectedSubjectId,
      });

      if (res.ok) {
        setChecks(res.data);
      } else {
        setError(res.error);
      }
      setLoadingChecks(false);
    }
    runChecks();
  }, [slot.id, facultyId, selectedSubjectId]);

  const handleConfirmBooking = async () => {
    if (!checks?.ok) return;

    setBooking(true);
    setError(null);

    const res = await api.call('bookSlot', {
      openSlotId: slot.id,
      facultyId,
      subjectId: selectedSubjectId,
    });

    setBooking(false);

    if (res.ok) {
      setSuccess(true);
      setTimeout(() => {
        onBooked();
        onClose();
      }, 1500);
    } else {
      setError(res.error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-xl p-6 md:p-8 space-y-6 my-8 animate-scale-in">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-100 text-amber-800">
                <Sparkles className="w-5 h-5 text-amber-600" />
              </span>
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">
                  Claim Open Academic Slot
                </h2>
                <p className="text-xs text-slate-500">
                  Take over a reserved academic hour for your own subject
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Slot Metadata Pill Box */}
        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              Reserved Academic Slot Details
            </span>
            {slot.score && (
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-500 text-white shadow-xs">
                {slot.score}% Match Score
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs text-slate-700 pt-1">
            <div className="flex items-center gap-2 font-medium">
              <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>
                {slot.date} &bull; Slot {slot.slotNo} ({slot.startTime}–{slot.endTime})
              </span>
            </div>

            <div className="flex items-center gap-2 font-medium">
              <GraduationCap className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>{slot.className} (Class Reserved)</span>
            </div>

            <div className="flex items-center gap-2 font-medium">
              <DoorOpen className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>{slot.roomName} (Room Reserved)</span>
            </div>

            <div className="flex items-center gap-2 font-medium">
              <User className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>Vacated by: {slot.originalFacultyName}</span>
            </div>
          </div>
        </div>

        {/* Subject Picker */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
            Select Your Subject To Teach
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {KAUR_SUBJECTS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedSubjectId(s.id)}
                className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                  selectedSubjectId === s.id
                    ? 'border-primary bg-indigo-50/80 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div>
                  <div className="font-bold text-xs text-slate-900">{s.name}</div>
                  <div className="text-[11px] text-slate-500">{s.code} &bull; {s.type}</div>
                </div>
                {selectedSubjectId === s.id && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Deterministic 5 Checks Live Panel */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Deterministic Conflict Verification (5 Checks)
            </span>
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                checks?.ok
                  ? 'bg-green-100 text-green-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {loadingChecks ? 'Verifying...' : checks?.ok ? 'All 5 Passed' : 'Checks In Progress'}
            </span>
          </div>

          <div className="space-y-2 bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4">
            {loadingChecks ? (
              <div className="text-center py-4 text-xs text-slate-400 animate-pulse">
                Evaluating conflict engine...
              </div>
            ) : (
              checks?.checks.map((chk) => (
                <div key={chk.key} className="flex items-start gap-2.5 text-xs">
                  {chk.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-bold text-slate-900 block leading-tight">
                      {chk.label}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {chk.detail}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="p-3 bg-green-50 text-green-800 border border-green-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span>Slot successfully booked! Refreshing timetable...</span>
          </div>
        ) : (
          <button
            onClick={handleConfirmBooking}
            disabled={!checks?.ok || booking}
            className="w-full py-3.5 rounded-2xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {booking
                ? 'Confirming Slot Allocation...'
                : 'Confirm & Claim Open Academic Slot'}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
