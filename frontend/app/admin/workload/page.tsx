'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { WorkloadRow } from '@shared/types';
import { WorkloadBar } from '@/components/workload-bar';
import {
  BarChart3,
  Users,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Sparkles,
  Search,
  Filter,
  RefreshCw,
} from 'lucide-react';

export default function AdminWorkloadPage() {
  const [workloads, setWorkloads] = useState<WorkloadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ok' | 'under' | 'over'>('all');

  const loadData = async () => {
    setLoading(true);
    const res = await api.call('getWorkload', {});
    if (res.ok) {
      setWorkloads(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredWorkloads = workloads.filter((row) => {
    const matchesSearch = row.facultyName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || row.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalFaculty = workloads.length;
  const optimalCount = workloads.filter((w) => w.status === 'ok').length;
  const underCount = workloads.filter((w) => w.status === 'under').length;
  const overCount = workloads.filter((w) => w.status === 'over').length;
  const totalExtraHours = workloads.reduce((sum, w) => sum + w.extraHours, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-primary to-indigo-700 text-white p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-200" />
            <h1 className="text-2xl font-bold tracking-tight">Faculty Workload Balance</h1>
          </div>
          <p className="text-sm text-indigo-100 mt-1 max-w-2xl">
            Real-time tracking of weekly teaching hours, statutory requirements (20 hrs target, 24 hrs max), and peer substitution extra lectures.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold rounded-xl transition-all self-start md:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-card border border-border p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Faculty</span>
            <Users className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-extrabold mt-1 text-foreground">{loading ? '...' : totalFaculty}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Tracked educators</div>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Optimal Load</span>
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-2xl font-extrabold mt-1 text-green-600">{loading ? '...' : optimalCount}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Meeting 20-24 hrs</div>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Under Target</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold mt-1 text-amber-600">{loading ? '...' : underCount}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">&lt; 20 hrs assigned</div>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Exceeded</span>
            <AlertOctagon className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-extrabold mt-1 text-red-600">{loading ? '...' : overCount}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">&gt; 24 hrs capacity</div>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Extra Slots</span>
            <Sparkles className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold mt-1 text-indigo-600">{loading ? '...' : `+${totalExtraHours} hrs`}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Via peer claims</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-card border border-border p-4 rounded-2xl shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search faculty name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-muted/40 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center gap-1 text-xs text-muted-foreground font-semibold mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>

          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/40 hover:bg-muted text-muted-foreground'
            }`}
          >
            All ({totalFaculty})
          </button>
          <button
            onClick={() => setStatusFilter('ok')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              statusFilter === 'ok'
                ? 'bg-green-600 text-white'
                : 'bg-muted/40 hover:bg-muted text-muted-foreground'
            }`}
          >
            Optimal ({optimalCount})
          </button>
          <button
            onClick={() => setStatusFilter('under')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              statusFilter === 'under'
                ? 'bg-amber-500 text-white'
                : 'bg-muted/40 hover:bg-muted text-muted-foreground'
            }`}
          >
            Under ({underCount})
          </button>
          <button
            onClick={() => setStatusFilter('over')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              statusFilter === 'over'
                ? 'bg-red-600 text-white'
                : 'bg-muted/40 hover:bg-muted text-muted-foreground'
            }`}
          >
            Over ({overCount})
          </button>
        </div>
      </div>

      {/* Workload Cards List */}
      {loading ? (
        <div className="p-12 text-center text-muted-foreground">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-sm">Calculating faculty workload balances...</p>
        </div>
      ) : filteredWorkloads.length === 0 ? (
        <div className="bg-card border border-border p-12 text-center rounded-2xl shadow-xs">
          <p className="text-muted-foreground text-sm">No faculty members found matching your filter criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredWorkloads.map((row) => (
            <WorkloadBar key={row.facultyId} row={row} showFacultyName={true} />
          ))}
        </div>
      )}

      {/* Info Notice */}
      <div className="bg-muted/30 border border-border p-4 rounded-xl text-xs text-muted-foreground space-y-1">
        <span className="font-semibold text-foreground block">Academic Regulations Reference:</span>
        <p>
          • <strong>Required (20 hrs):</strong> Baseline regular lecture commitments mandated by academic regulation.
        </p>
        <p>
          • <strong>Max Capacity (24 hrs):</strong> Hard ceiling of weekly teaching hours to prevent instructor burnout.
        </p>
        <p>
          • <strong>Open Slot Claims:</strong> When faculty claim peer substitution slots, hours accrue as Extra Lectures (+1 hr) towards the 24 hr limit.
        </p>
      </div>
    </div>
  );
}
