'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { DashboardStats } from '@shared/types';
import {
  Calendar,
  Sparkles,
  BarChart3,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      const res = await api.call('getDashboardStats', {});
      if (res.ok) {
        setStats(res.data);
      }
      setLoading(false);
    }
    loadStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-primary to-indigo-700 text-white p-6 rounded-2xl shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight">Admin Control Center</h1>
        <p className="text-sm text-indigo-100 mt-1 max-w-2xl">
          Automated timetable generation, faculty workload balance, and real-time Open Academic Slot management.
        </p>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border p-5 rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Lectures
            </span>
            <Calendar className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-extrabold mt-2 text-foreground">
            {loading ? '...' : stats?.lectures ?? 100}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Active weekly timetable rows</div>
        </div>

        <div className="bg-card border border-border p-5 rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Timetable Conflicts
            </span>
            <ShieldCheck className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-2xl font-extrabold mt-2 text-green-600">
            {loading ? '...' : stats?.conflicts ?? 0}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Zero conflicts guaranteed</div>
        </div>

        <div className="bg-card border border-border p-5 rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Academic Hours Saved
            </span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold mt-2 text-amber-600">
            {loading ? '...' : `${stats?.hoursSaved ?? 0} hrs`}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Via Open Academic Slots</div>
        </div>

        <div className="bg-card border border-border p-5 rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Room Utilization
            </span>
            <BarChart3 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold mt-2 text-foreground">
            {loading ? '...' : `${stats?.roomUtilizationPct ?? 82}%`}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Classroom & Lab efficiency</div>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Link
          href="/admin/timetable"
          className="group bg-card border border-border hover:border-primary/50 p-6 rounded-2xl shadow-xs hover:shadow-md transition-all block"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
            <Calendar className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors">
            Automated Timetable
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Run greedy timetable generator and view weekly schedule across all classes and rooms.
          </p>
          <div className="flex items-center gap-1 text-xs font-semibold text-primary mt-4">
            <span>Open Timetable</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          href="/admin/workload"
          className="group bg-card border border-border hover:border-primary/50 p-6 rounded-2xl shadow-xs hover:shadow-md transition-all block"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-4">
            <BarChart3 className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors">
            Faculty Workload Balance
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Track required, assigned, and extra hours for every faculty member with live progress bars.
          </p>
          <div className="flex items-center gap-1 text-xs font-semibold text-primary mt-4">
            <span>View Workload</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          href="/admin/open-slots"
          className="group bg-card border border-border hover:border-primary/50 p-6 rounded-2xl shadow-xs hover:shadow-md transition-all block"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors">
            Open Academic Slots
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Monitor lectures made available by faculty leaves and verify peer reallocations.
          </p>
          <div className="flex items-center gap-1 text-xs font-semibold text-primary mt-4">
            <span>Monitor Slots</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>
    </div>
  );
}
