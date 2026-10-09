'use client';

import { useState } from 'react';
import Link from 'next/link';
import { setSession } from '@/lib/session';
import {
  Calendar,
  Sparkles,
  Zap,
  ShieldCheck,
  BarChart3,
  DoorOpen,
  Bell,
  Clock,
  ArrowRight,
  GraduationCap,
  Users,
  CheckCircle2,
  FileSpreadsheet,
  FlaskConical,
  Award,
} from 'lucide-react';

export default function HomePage() {
  const [navigating, setNavigating] = useState<string | null>(null);

  const launchPersona = (role: 'admin' | 'faculty', name: string, facultyId?: string) => {
    setNavigating(name);
    setSession({
      userId:
        role === 'admin'
          ? '10000000-0000-0000-0000-000000000001'
          : facultyId === '20000000-0000-0000-0000-000000000001'
          ? '10000000-0000-0000-0000-000000000002'
          : '10000000-0000-0000-0000-000000000003',
      name,
      role,
      facultyId,
    });
    window.location.href = role === 'admin' ? '/admin' : '/faculty';
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] text-slate-900 selection:bg-indigo-600 selection:text-white">
      {/* Background Luminous Mesh & Subtle Grid */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-indigo-50/70 via-purple-50/30 to-transparent" />
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-200/25 rounded-full blur-3xl" />
        <div className="absolute top-1/4 -right-32 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-1/3 w-96 h-96 bg-blue-100/30 rounded-full blur-3xl" />
        {/* Fine subtle blueprint dot grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-60" />
      </div>

      {/* Navigation Header */}
      <header className="relative z-20 border-b border-slate-200/70 bg-white/80 backdrop-blur-md sticky top-0 shadow-2xs">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center text-white font-black shadow-md shadow-indigo-600/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900 block leading-tight">
                SchedNexa
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-600">
                Academic Resource Core
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              id="header-admin-link"
              className="text-xs font-semibold text-slate-700 hover:text-indigo-600 transition-colors"
            >
              Admin Portal
            </Link>
            <Link
              href="/faculty"
              id="header-faculty-link"
              className="text-xs font-semibold text-slate-700 hover:text-indigo-600 transition-colors"
            >
              Faculty Portal
            </Link>
            <Link
              href="/login"
              id="header-login-btn"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            >
              Sign In
            </Link>
            <button
              id="header-launch-demo-btn"
              onClick={() => launchPersona('admin', 'Administrator')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              Launch Live Demo
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-16 px-6 max-w-5xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-indigo-200/80 text-indigo-700 text-xs font-semibold shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Zero Cancelled Lectures • Intelligent Academic Substitution</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 leading-[1.15]">
          Never let a cancelled lecture become a{' '}
          <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 bg-clip-text text-transparent">
            wasted academic hour
          </span>
          .
        </h1>

        <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
          SchedNexa is the next-generation academic resource manager. Combine greedy 0-conflict timetable generation with automated <strong className="text-slate-800 font-semibold">Open Academic Slots</strong> that convert faculty leave periods into claimable peer lectures in real-time.
        </p>

        {/* Interactive Quick Launch Cards */}
        <div className="pt-6">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3.5">
            Choose a Persona to Explore Instantly:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto text-left">
            {/* Admin Persona */}
            <button
              id="persona-admin-btn"
              onClick={() => launchPersona('admin', 'Administrator')}
              disabled={navigating !== null}
              className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-500/5 transition-all group shadow-xs cursor-pointer text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="font-bold text-sm text-slate-900 flex items-center justify-between">
                <span>Admin Control</span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Run greedy generator, inspect 0 conflicts, monitor room matrix & faculty workloads.
              </p>
            </button>

            {/* Dr. Sharma Persona */}
            <button
              id="persona-sharma-btn"
              onClick={() => launchPersona('faculty', 'Dr. Sharma', '20000000-0000-0000-0000-000000000001')}
              disabled={navigating !== null}
              className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-amber-400 hover:shadow-xl hover:shadow-amber-500/5 transition-all group shadow-xs cursor-pointer text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="font-bold text-sm text-slate-900 flex items-center justify-between">
                <span>Dr. Sharma (DBMS)</span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Mark Leave on Friday Slot 2. Watch your DBMS lecture instantly convert to an Open Slot!
              </p>
            </button>

            {/* Prof. Kaur Persona */}
            <button
              id="persona-kaur-btn"
              onClick={() => launchPersona('faculty', 'Prof. Kaur', '20000000-0000-0000-0000-000000000002')}
              disabled={navigating !== null}
              className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-purple-400 hover:shadow-xl hover:shadow-purple-500/5 transition-all group shadow-xs cursor-pointer text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="font-bold text-sm text-slate-900 flex items-center justify-between">
                <span>Prof. Kaur (OS)</span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Browse open slots feed, pass live 5-point conflict checks, and claim extra lectures.
              </p>
            </button>
          </div>
        </div>
      </section>

      {/* Live KPIs Ticker Bar */}
      <section className="relative z-10 border-y border-slate-200/80 bg-white/80 backdrop-blur-sm py-8 px-6 shadow-2xs">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-3xl font-black text-indigo-600">100+</div>
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mt-1">
              Lectures Scheduled
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Automated greedy placement</div>
          </div>

          <div>
            <div className="text-3xl font-black text-emerald-600">0</div>
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mt-1">
              Collisions Guaranteed
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Class, room & teacher safety</div>
          </div>

          <div>
            <div className="text-3xl font-black text-purple-600">82%</div>
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mt-1">
              Facility Utilization
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Optimized class & lab periods</div>
          </div>

          <div>
            <div className="text-3xl font-black text-amber-600">100%</div>
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mt-1">
              Hours Rescued
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Via Open Academic Slots</div>
          </div>
        </div>
      </section>

      {/* 6 Feature Pillars Grid */}
      <section className="relative z-10 py-20 px-6 max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-indigo-600">
            Capabilities Architecture
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            Comprehensive Academic Engine Built for Excellence
          </h2>
          <p className="text-sm text-slate-600 max-w-2xl mx-auto">
            Engineered from mathematical constraints and real-world university regulations to automate scheduling and eliminate downtime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/5 transition-all space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">0-Conflict Greedy Generator</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Synthesizes master weekly timetables in milliseconds. Honors 2-slot contiguous lab blocks, uniform lunch intervals (13:10–14:00), and classroom seating limits.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 hover:border-amber-300 hover:shadow-xl hover:shadow-amber-500/5 transition-all space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Open Academic Slots</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              When faculty mark leave, their lectures are automatically transformed into Open Academic Slots. Peer professors claim slots with zero administrative paperwork.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-500/5 transition-all space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Workload Compliance Bars</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Live tracking of educator statutory loads. Dynamic progress indicators reflect target baseline (20 hrs), maximum cap (24 hrs), and accrued substitution hours.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 hover:border-purple-300 hover:shadow-xl hover:shadow-purple-500/5 transition-all space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Deterministic 5-Check Safety</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every slot claim verifies 5 rigorous conditions: Class availability, Faculty free status, Room vacancy, Class-Subject curriculum match, and Workload capacity.
            </p>
          </div>

          {/* Card 5 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/5 transition-all space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
              <DoorOpen className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Room & Lab Occupancy Matrix</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Comprehensive slot-by-slot availability across classrooms and specialty computing laboratories with date-aware tracking and ad-hoc booking workflows.
            </p>
          </div>

          {/* Card 6 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 hover:border-pink-300 hover:shadow-xl hover:shadow-pink-500/5 transition-all space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-pink-50 border border-pink-100 text-pink-600 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Real-Time Event Dispatcher</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Instant alerts notify faculty when peer absences create available lecture slots. Updates reflect live across header bells and daily timetable overlays.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200/80 bg-slate-100/70 py-10 px-6 text-center text-xs text-slate-500 space-y-2">
        <div className="flex items-center justify-center gap-2 font-bold text-slate-800">
          <GraduationCap className="w-4 h-4 text-indigo-600" />
          <span>SchedNexa Smart Academic Resource Manager</span>
        </div>
        <p>Built for academic excellence • All rights reserved • 2026</p>
      </footer>
    </div>
  );
}
