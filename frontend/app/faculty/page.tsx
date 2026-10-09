'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSession, type SessionData } from '@/lib/session';
import {
  Calendar,
  CalendarPlus,
  Sparkles,
  FlaskConical,
  ArrowRight,
  Clock,
  BookOpen,
} from 'lucide-react';

export default function FacultyDashboardPage() {
  const [session, setSession] = useState<SessionData | null>(null);

  useEffect(() => {
    setSession(getSession());
  }, []);

  return (
    <div className="space-y-6">
      {/* Faculty Welcome Banner */}
      <div className="bg-gradient-to-r from-primary to-indigo-700 text-white p-6 rounded-2xl shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {session?.name || 'Faculty Member'}
        </h1>
        <p className="text-sm text-indigo-100 mt-1 max-w-2xl">
          Manage your lectures, schedule leave with automatic Open Academic Slot creation, and claim available slots for your subjects.
        </p>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Link
          href="/faculty/timetable"
          className="group bg-card border border-border hover:border-primary/50 p-6 rounded-2xl shadow-xs hover:shadow-md transition-all block"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
            <Calendar className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors">
            My Timetable
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            View your weekly schedule, classrooms, lab blocks, and effective daily overlay.
          </p>
          <div className="flex items-center gap-1 text-xs font-semibold text-primary mt-4">
            <span>View Schedule</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          href="/faculty/leave"
          className="group bg-card border border-border hover:border-primary/50 p-6 rounded-2xl shadow-xs hover:shadow-md transition-all block"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
            <CalendarPlus className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors">
            Mark Leave
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Request leave with instant preview of affected lectures converted to Open Academic Slots.
          </p>
          <div className="flex items-center gap-1 text-xs font-semibold text-primary mt-4">
            <span>Request Leave</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          href="/faculty/open-slots"
          className="group bg-card border border-border hover:border-primary/50 p-6 rounded-2xl shadow-xs hover:shadow-md transition-all block"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-4">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors">
            Open Academic Slots
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Browse available slots from absent colleagues and claim them for your eligible subjects.
          </p>
          <div className="flex items-center gap-1 text-xs font-semibold text-primary mt-4">
            <span>Browse Slots</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>

      {/* Demo Flow Guide Card */}
      <div className="bg-card border border-border p-6 rounded-2xl shadow-xs">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-2">
          Hackathon Demo Persona Quick Guide
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground mt-3">
          <div className="p-3 bg-muted/30 rounded-xl border border-border/60">
            <span className="font-semibold text-foreground block mb-1">Dr. Sharma Flow</span>
            Teaches DBMS. On Friday Slot 2 (09:50-10:40) in Room 101. Use <strong>Mark Leave</strong> for Friday to turn this lecture into an Open Academic Slot.
          </div>
          <div className="p-3 bg-muted/30 rounded-xl border border-border/60">
            <span className="font-semibold text-foreground block mb-1">Prof. Kaur Flow</span>
            Teaches Operating Systems. After Dr. Sharma marks leave, switch to Prof. Kaur, check notifications, and claim the Friday Open Slot with OS!
          </div>
        </div>
      </div>
    </div>
  );
}
