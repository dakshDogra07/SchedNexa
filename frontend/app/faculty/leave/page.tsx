'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { getSession } from '@/lib/session';
import type { AffectedLecture } from '@shared/types';
import {
  CalendarPlus,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Clock,
  DoorOpen,
  GraduationCap,
  ArrowRight,
  Info,
} from 'lucide-react';

export default function MarkLeavePage() {
  const router = useRouter();
  const [session, setSession] = useState(getSession());
  const [dateFrom, setDateFrom] = useState('2026-10-16'); // Demo Friday
  const [dateTo, setDateTo] = useState('2026-10-16');
  const [reason, setReason] = useState('Attending National Computer Science Symposium');

  const [impact, setImpact] = useState<AffectedLecture[]>([]);
  const [loadingImpact, setLoadingImpact] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load affected lectures when dates or facultyId change
  useEffect(() => {
    async function checkImpact() {
      if (!session?.facultyId) return;
      setLoadingImpact(true);
      setErrorMessage(null);

      const res = await api.call('getLeaveImpact', {
        facultyId: session.facultyId,
        dateFrom,
        dateTo,
      });

      if (res.ok) {
        setImpact(res.data);
      } else {
        setErrorMessage(res.error);
      }
      setLoadingImpact(false);
    }
    checkImpact();
  }, [dateFrom, dateTo, session?.facultyId]);

  const handleConfirmLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.facultyId) return;

    setSubmitting(true);
    setErrorMessage(null);

    const res = await api.call('markLeave', {
      facultyId: session.facultyId,
      dateFrom,
      dateTo,
      reason,
    });

    setSubmitting(false);

    if (res.ok) {
      setSuccessResult(true);
    } else {
      setErrorMessage(res.error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <CalendarPlus className="w-6 h-6 text-primary" />
          Mark Faculty Leave
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Schedule leave without wasting teaching hours. Affected lectures automatically become Open Academic Slots.
        </p>
      </div>

      {successResult ? (
        <div className="bg-white rounded-2xl border border-green-200 p-8 shadow-sm text-center space-y-4 animate-scale-in">
          <div className="w-14 h-14 rounded-full bg-green-100 text-green-700 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Leave Confirmed &bull; Open Academic Slots Created!
          </h2>
          <p className="text-sm text-slate-600 max-w-lg mx-auto">
            Your {impact.length} scheduled lecture(s) on {dateFrom} will remain reserved as Open Academic Slots. Eligible faculty members (such as Prof. Kaur) have received in-app notifications to claim the slots.
          </p>

          <div className="pt-4 flex items-center justify-center gap-3">
            <button
              onClick={() => router.push('/faculty/timetable')}
              className="px-5 py-2.5 rounded-xl bg-primary text-white font-semibold text-xs hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2"
            >
              <span>View Timetable Overlay</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setSuccessResult(false)}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors"
            >
              Mark Another Leave
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Form Side */}
          <div className="md:col-span-5 bg-card border border-border p-6 rounded-2xl shadow-xs space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Leave Details
            </h2>

            <form onSubmit={handleConfirmLeave} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  required
                  className="w-full text-xs font-medium p-2.5 rounded-xl border border-border bg-background focus:outline-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  required
                  className="w-full text-xs font-medium p-2.5 rounded-xl border border-border bg-background focus:outline-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Reason (Optional)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  placeholder="Enter reason for leave..."
                  className="w-full text-xs font-medium p-2.5 rounded-xl border border-border bg-background focus:outline-primary resize-none"
                />
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || impact.length === 0}
                className="w-full py-3 rounded-xl bg-primary text-white font-semibold text-xs hover:bg-primary/90 transition-all shadow-md shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {submitting
                    ? 'Confirming Leave...'
                    : `Confirm Leave (${impact.length} Lecture${impact.length === 1 ? '' : 's'})`}
                </span>
              </button>
            </form>
          </div>

          {/* Impact Preview Side */}
          <div className="md:col-span-7 bg-card border border-border p-6 rounded-2xl shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                Affected Lectures Preview
              </h2>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                {impact.length} Affected
              </span>
            </div>

            <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Open Academic Slot Guarantee:</span>
                Lectures listed below will NOT be lost or cancelled. The students, classroom, and time slot remain reserved so eligible peer faculty can take them.
              </div>
            </div>

            {loadingImpact ? (
              <div className="p-8 text-center text-xs text-muted-foreground animate-pulse">
                Analyzing timetable impact...
              </div>
            ) : impact.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                No lectures are scheduled for you on the selected dates.
              </div>
            ) : (
              <div className="space-y-3">
                {impact.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-slate-200/80 bg-white hover:border-amber-400 transition-all shadow-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">
                          {item.subjectName}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          Becomes Open Slot
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500 mt-1.5">
                        <span className="flex items-center gap-1 font-medium">
                          <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                          {item.className}
                        </span>
                        <span className="flex items-center gap-1 font-medium">
                          <DoorOpen className="w-3.5 h-3.5 text-slate-400" />
                          {item.roomName}
                        </span>
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          Slot {item.slotNo} ({item.startTime} – {item.endTime})
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
