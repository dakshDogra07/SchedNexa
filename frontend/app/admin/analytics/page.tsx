'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { UtilizationHeatmap } from '@/components/charts/utilization-heatmap';
import { HoursSavedChart } from '@/components/charts/hours-saved-chart';
import {
  BarChart3,
  TrendingUp,
  Sparkles,
  Flame,
  Award,
  RefreshCw,
  Building,
  GraduationCap,
  Calendar,
  Layers,
} from 'lucide-react';

interface FacultyRescueItem {
  name: string;
  department: string;
  hours: number;
  efficiency: number;
}

interface RoomEfficiencyItem {
  name: string;
  type: string;
  capacity: number;
  utilization: number;
}

export default function AdminAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    peakHoursHeatmap?: any[];
    hoursSavedTimeline?: any[];
    openSlotsRatio?: any[];
    weeklyTrends?: any[];
    facultyRescues?: FacultyRescueItem[];
    roomEfficiency?: RoomEfficiencyItem[];
  }>({});

  const loadAnalytics = async () => {
    setLoading(true);
    const res = await api.call('getAnalytics', {});
    if (res.ok) {
      setData(res.data as any);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  return (
    <div className="space-y-6">
      {/* Banner / Header */}
      <div className="bg-gradient-to-r from-primary to-indigo-800 text-white p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-200" />
            <h1 className="text-2xl font-bold tracking-tight">Executive Academic Analytics</h1>
          </div>
          <p className="text-sm text-indigo-100 mt-1 max-w-2xl">
            Real-time heatmaps, facility capacity tracking, and Open Academic Slot lecture preservation metrics.
          </p>
        </div>

        <button
          onClick={loadAnalytics}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl border border-white/20 transition-all cursor-pointer w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Total Rescued
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-primary flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-foreground">29 hrs</span>
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
              +18% this month
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Preserved academic lecture periods
          </p>
        </div>

        <div className="bg-card border border-border p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Slots Conversion
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-foreground">80.0%</span>
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
              Goal: &gt;75%
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            24 of 30 open slots claimed by peers
          </p>
        </div>

        <div className="bg-card border border-border p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Peak Slot Utilization
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-foreground">100%</span>
            <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
              Slot 3 (11:15)
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Highest demand academic time window
          </p>
        </div>

        <div className="bg-card border border-border p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Facility Utilization
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-foreground">82.8%</span>
            <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
              Optimal
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Average across 5 academic rooms & labs
          </p>
        </div>
      </div>

      {/* Main Charts */}
      {data.hoursSavedTimeline && data.openSlotsRatio && (
        <HoursSavedChart
          timeline={data.hoursSavedTimeline}
          ratio={data.openSlotsRatio}
          weekly={data.weeklyTrends || []}
        />
      )}

      {/* Peak-Hour Heatmap Grid */}
      {data.peakHoursHeatmap && (
        <UtilizationHeatmap data={data.peakHoursHeatmap} />
      )}

      {/* Tables Breakdown: Faculty Leaderboard & Room Efficiency */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Faculty Claimers */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-xs">
          <div className="flex items-center gap-2 border-b border-border pb-3 mb-4">
            <Award className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="font-bold text-sm text-foreground">
                Faculty Substitution Leaders
              </h3>
              <p className="text-xs text-muted-foreground">
                Highest hours claimed through Open Academic Slots
              </p>
            </div>
          </div>

          <div className="divide-y divide-border">
            {(data.facultyRescues || []).map((fac, idx) => (
              <div key={fac.name} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      idx === 0
                        ? 'bg-amber-100 text-amber-800'
                        : idx === 1
                        ? 'bg-slate-200 text-slate-800'
                        : idx === 2
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <div>
                    <p className="font-bold text-xs text-foreground">{fac.name}</p>
                    <p className="text-[11px] text-muted-foreground">{fac.department}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-extrabold text-xs text-primary block">
                    {fac.hours} hrs claimed
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-600">
                    {fac.efficiency}% fulfillment
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Room & Lab Load Breakdown */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-xs">
          <div className="flex items-center gap-2 border-b border-border pb-3 mb-4">
            <Building className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="font-bold text-sm text-foreground">
                Room & Lab Capacity Efficiency
              </h3>
              <p className="text-xs text-muted-foreground">
                Weekly scheduled occupancy percentage per facility
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {(data.roomEfficiency || []).map((rm) => (
              <div key={rm.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">{rm.name}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground">
                      {rm.type} &bull; {rm.capacity} seats
                    </span>
                  </div>
                  <span className="font-bold text-primary">{rm.utilization}%</span>
                </div>
                <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      rm.utilization >= 90
                        ? 'bg-indigo-700'
                        : rm.utilization >= 80
                        ? 'bg-primary'
                        : 'bg-indigo-400'
                    }`}
                    style={{ width: `${rm.utilization}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
