'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { setSession, DEMO_PROFILES, type SessionData } from '@/lib/session';
import { api } from '@/lib/api';
import {
  GraduationCap,
  ShieldAlert,
  UserCheck,
  RotateCcw,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [resetting, setResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const handleSelectUser = (profile: SessionData) => {
    setSession(profile);
    const target = profile.role === 'admin' ? '/admin' : '/faculty';
    window.location.href = target;
  };

  const handleResetDemo = async () => {
    setResetting(true);
    setResetMessage(null);
    try {
      const res = await api.call('resetDemo', {});
      if (res.ok) {
        setResetMessage('Demo data reset successfully to fixed seed state!');
        setTimeout(() => setResetMessage(null), 4000);
      } else {
        setResetMessage(`Reset failed: ${res.error}`);
      }
    } finally {
      setResetting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-foreground">
      <div className="w-full max-w-xl">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center mx-auto mb-4 shadow-md shadow-primary/25">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            SchedNexa
          </h1>
          <p className="mt-2 text-sm text-slate-600 font-medium">
            Smart Academic Resource Manager &bull; Faculty Load & Timetable
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Do not let a cancelled lecture become a wasted academic hour</span>
          </div>
        </div>

        {/* Demo Login Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xl p-8 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Select Demo Persona
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Instant login for hackathon evaluation and demonstration flow
            </p>
          </div>

          <div className="grid gap-3">
            {DEMO_PROFILES.map((profile) => {
              const isAdmin = profile.role === 'admin';
              return (
                <button
                  key={profile.userId}
                  onClick={() => handleSelectUser(profile)}
                  className="group flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-primary/60 hover:bg-slate-50/80 transition-all text-left shadow-xs hover:shadow-md"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isAdmin
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-indigo-100 text-indigo-700'
                      }`}
                    >
                      {isAdmin ? (
                        <ShieldAlert className="w-5 h-5" />
                      ) : (
                        <UserCheck className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 group-hover:text-primary transition-colors flex items-center gap-2">
                        {profile.name}
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {profile.role}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {isAdmin
                          ? 'Full administrative control, generator, and system analytics'
                          : profile.name === 'Dr. Sharma'
                          ? 'DBMS faculty (Demo Step 3 & 4: Mark Leave)'
                          : 'OS faculty (Demo Step 6 & 7: Claim Open Slot)'}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </button>
              );
            })}
          </div>

          {/* Reset Demo Option */}
          <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
            {resetMessage && (
              <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 p-2.5 rounded-lg animate-fade-in">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{resetMessage}</span>
              </div>
            )}

            <button
              onClick={handleResetDemo}
              disabled={resetting}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-dashed border-slate-300 text-slate-600 hover:text-slate-900 hover:border-slate-400 hover:bg-slate-50 transition-colors text-xs font-semibold disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin text-primary' : ''}`} />
              <span>{resetting ? 'Resetting Demo State...' : 'Reset Demo to Initial Seed State'}</span>
            </button>
          </div>
        </div>

        <div className="text-center mt-6 text-xs text-slate-400">
          SchedNexa &bull; Open Academic Slot Demonstration &bull; App Router v14
        </div>
      </div>
    </main>
  );
}
