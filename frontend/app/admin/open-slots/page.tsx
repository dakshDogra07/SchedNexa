'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { OpenSlotView, DashboardStats, Recommendation } from '@shared/types';
import {
  Sparkles,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  BookOpen,
  DoorOpen,
  Filter,
  Search,
  RefreshCw,
  Award,
  ChevronRight,
  X,
  Zap,
} from 'lucide-react';

export default function AdminOpenSlotsPage() {
  const [slots, setSlots] = useState<OpenSlotView[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'booked'>('all');
  const [search, setSearch] = useState('');

  // Selected slot for viewing recommendations
  const [activeSlotRecs, setActiveSlotRecs] = useState<OpenSlotView | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const [slotsRes, statsRes] = await Promise.all([
      api.call('getOpenSlots', {}),
      api.call('getDashboardStats', {}),
    ]);

    if (slotsRes.ok) {
      setSlots(slotsRes.data);
    }
    if (statsRes.ok) {
      setStats(statsRes.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const openRecsModal = async (slot: OpenSlotView) => {
    setActiveSlotRecs(slot);
    setLoadingRecs(true);
    const res = await api.call('getRecommendations', { openSlotId: slot.id });
    if (res.ok) {
      setRecommendations(res.data);
    }
    setLoadingRecs(false);
  };

  const handleSimulateLeave = async () => {
    setLoading(true);
    // Mark leave for Dr. Sharma on Friday 2026-10-16
    await api.call('markLeave', {
      facultyId: '20000000-0000-0000-0000-000000000001',
      dateFrom: '2026-10-16',
      dateTo: '2026-10-16',
      reason: 'Academic Conference Attendance',
    });
    await loadData();
  };

  const filteredSlots = slots.filter((s) => {
    const matchesFilter = statusFilter === 'all' || s.status === statusFilter;
    const query = search.toLowerCase();
    const matchesSearch =
      s.className.toLowerCase().includes(query) ||
      s.originalFacultyName.toLowerCase().includes(query) ||
      s.originalSubjectName.toLowerCase().includes(query) ||
      s.roomName.toLowerCase().includes(query);
    return matchesFilter && matchesSearch;
  });

  const openCount = slots.filter((s) => s.status === 'open').length;
  const bookedCount = slots.filter((s) => s.status === 'booked').length;
  const totalSlots = slots.length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-primary to-indigo-700 text-white p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-300" />
            <h1 className="text-2xl font-bold tracking-tight">Open Academic Slots Monitor</h1>
          </div>
          <p className="text-sm text-indigo-100 mt-1 max-w-2xl">
            Live monitoring of vacant lecture slots triggered by faculty leaves. Oversee peer reallocations, candidate recommendations, and saved academic hours.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={handleSimulateLeave}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Simulate Leave (Demo)</span>
          </button>

          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-card border border-border p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Leave Slots</span>
            <Calendar className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-extrabold mt-1 text-foreground">{loading ? '...' : totalSlots}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Lectures converted to open slots</div>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Awaiting Claim</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold mt-1 text-amber-600">{loading ? '...' : openCount}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Available for peer faculty</div>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Rescued (Booked)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold mt-1 text-emerald-600">{loading ? '...' : bookedCount}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Covered without cancellation</div>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Hours Saved</span>
            <Clock className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold mt-1 text-indigo-600">
            {loading ? '...' : `${stats?.hoursSaved ?? (bookedCount * 1)} hrs`}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Zero student disruption</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-card border border-border p-4 rounded-2xl shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search class, faculty, subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-muted/40 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground font-semibold mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
          </div>

          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/40 hover:bg-muted text-muted-foreground'
            }`}
          >
            All ({totalSlots})
          </button>
          <button
            onClick={() => setStatusFilter('open')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              statusFilter === 'open'
                ? 'bg-amber-500 text-white'
                : 'bg-muted/40 hover:bg-muted text-muted-foreground'
            }`}
          >
            Open ({openCount})
          </button>
          <button
            onClick={() => setStatusFilter('booked')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              statusFilter === 'booked'
                ? 'bg-emerald-600 text-white'
                : 'bg-muted/40 hover:bg-muted text-muted-foreground'
            }`}
          >
            Booked ({bookedCount})
          </button>
        </div>
      </div>

      {/* Slots Table */}
      <div className="bg-card border border-border rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-muted-foreground">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-sm">Loading Open Academic Slots...</p>
          </div>
        ) : filteredSlots.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground space-y-3">
            <Sparkles className="w-10 h-10 mx-auto text-amber-500/50" />
            <div className="font-semibold text-foreground text-sm">No Open Academic Slots Found</div>
            <p className="text-xs max-w-md mx-auto">
              When faculty mark leaves, their scheduled periods automatically appear here. Click &quot;Simulate Leave (Demo)&quot; above to create a test slot.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-muted/40 border-b border-border">
                  <th className="p-3.5 font-bold text-foreground">Date & Slot</th>
                  <th className="p-3.5 font-bold text-foreground">Class & Room</th>
                  <th className="p-3.5 font-bold text-foreground">Original Lecture</th>
                  <th className="p-3.5 font-bold text-foreground">Faculty on Leave</th>
                  <th className="p-3.5 font-bold text-foreground">Status</th>
                  <th className="p-3.5 font-bold text-foreground text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredSlots.map((slot) => (
                  <tr key={slot.id} className="hover:bg-muted/10 transition-colors">
                    {/* Date & Slot */}
                    <td className="p-3.5">
                      <div className="font-bold text-foreground">{slot.date}</div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-primary" />
                        <span>{slot.startTime} - {slot.endTime}</span>
                      </div>
                    </td>

                    {/* Class & Room */}
                    <td className="p-3.5">
                      <div className="font-bold text-foreground">{slot.className}</div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <DoorOpen className="w-3 h-3 text-muted-foreground" />
                        <span>{slot.roomName}</span>
                      </div>
                    </td>

                    {/* Subject */}
                    <td className="p-3.5">
                      <div className="font-semibold text-foreground">{slot.originalSubjectName}</div>
                      <span className="text-[10px] text-muted-foreground uppercase">Theory Period</span>
                    </td>

                    {/* Faculty */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5 font-medium text-foreground">
                        <User className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{slot.originalFacultyName}</span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="p-3.5">
                      {slot.status === 'open' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                          <Sparkles className="w-3 h-3 text-amber-600" />
                          OPEN (Claimable)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          BOOKED
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => openRecsModal(slot)}
                        className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary transition-colors cursor-pointer"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>Recommendations</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* AI Recommendations Modal */}
      {activeSlotRecs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  Candidate Faculty Recommendations
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Algorithmic matching for {activeSlotRecs.className} on {activeSlotRecs.date} ({activeSlotRecs.startTime})
                </p>
              </div>

              <button
                onClick={() => setActiveSlotRecs(null)}
                className="p-1 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {loadingRecs ? (
              <div className="p-8 text-center text-muted-foreground text-xs">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
                Evaluating faculty schedules and syllabus compatibility...
              </div>
            ) : recommendations.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-xs">
                No candidate recommendations available for this slot.
              </div>
            ) : (
              <div className="space-y-3">
                {recommendations.map((rec, i) => (
                  <div
                    key={rec.facultyId}
                    className="p-4 bg-muted/20 border border-border rounded-xl space-y-2 hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center">
                          #{i + 1}
                        </span>
                        <span className="font-bold text-sm text-foreground">{rec.facultyName}</span>
                      </div>
                      <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {rec.score}% Match
                      </span>
                    </div>

                    <div className="space-y-1 pl-7">
                      {rec.reasons.map((reason, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 border-t border-border flex justify-end">
              <button
                onClick={() => setActiveSlotRecs(null)}
                className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
