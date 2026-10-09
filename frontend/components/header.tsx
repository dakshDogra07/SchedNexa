'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, setSession, clearSession, DEMO_PROFILES, type SessionData } from '@/lib/session';
import { api } from '@/lib/api';
import { RotateCcw, User, ArrowRightLeft, LogOut, CheckCircle2 } from 'lucide-react';
import { NotificationBell } from './notification-bell';

export function Header({ currentSession }: { currentSession: SessionData | null }) {
  const router = useRouter();
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSwitchUser = (profile: SessionData) => {
    setSession(profile);
    const target = profile.role === 'admin' ? '/admin' : '/faculty';
    window.location.href = target;
  };

  const handleResetDemo = async () => {
    setResetting(true);
    setMessage(null);
    try {
      const res = await api.call('resetDemo', {});
      if (res.ok) {
        setMessage('Demo reset successfully!');
        setTimeout(() => setMessage(null), 3000);
        window.location.reload();
      } else {
        setMessage(`Error: ${res.error}`);
      }
    } finally {
      setResetting(false);
    }
  };

  const handleLogout = () => {
    clearSession();
    window.location.href = '/login';
  };

  return (
    <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      {/* Current Page / Role Context */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Logged in as:</span>
          <span className="font-semibold text-foreground bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-xs">
            {currentSession?.name || 'Guest'} ({currentSession?.role || 'None'})
          </span>
        </div>

        {message && (
          <div className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-md animate-fade-in">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{message}</span>
          </div>
        )}
      </div>

      {/* Demo Switcher & Global Actions */}
      <div className="flex items-center gap-3">
        {/* Quick User Switcher for Demo Flow */}
        <div className="flex items-center bg-muted/60 p-1 rounded-lg border border-border">
          <span className="text-xs font-medium text-muted-foreground px-2 flex items-center gap-1">
            <ArrowRightLeft className="w-3 h-3" /> Demo Switch:
          </span>
          {DEMO_PROFILES.map((p) => {
            const isCurrent = currentSession?.userId === p.userId;
            return (
              <button
                key={p.userId}
                onClick={() => handleSwitchUser(p)}
                className={`text-xs px-2.5 py-1 rounded-md transition-colors font-medium ${
                  isCurrent
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {p.name}
              </button>
            );
          })}
        </div>

        {/* Notification Bell */}
        {currentSession && (
          <NotificationBell userId={currentSession.userId} />
        )}

        {/* Reset Demo Button */}
        <button
          onClick={handleResetDemo}
          disabled={resetting}
          title="Reset Demo data and timetable to fixed seed state"
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-border text-foreground bg-card hover:bg-muted transition-colors disabled:opacity-50 shadow-xs"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin text-primary' : 'text-muted-foreground'}`} />
          <span>{resetting ? 'Resetting...' : 'Reset Demo'}</span>
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          title="Log out"
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
