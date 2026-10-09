'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSession } from '@/lib/session';
import { useNotifications } from '@/lib/use-notifications';
import {
  Bell,
  Sparkles,
  CheckCircle2,
  FlaskConical,
  Check,
  Calendar,
} from 'lucide-react';

export default function FacultyNotificationsPage() {
  const [session, setSession] = useState(getSession());
  const { notifications, loading, markAsRead } = useNotifications(session?.userId);

  useEffect(() => {
    setSession(getSession());
  }, []);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Bell className="w-6 h-6 text-primary" />
          Notification Center
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Real-time alerts for open academic slot opportunities, confirmed extra lectures, and lab bookings.
        </p>
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-xs divide-y divide-border/60 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-muted-foreground animate-pulse">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-xs text-muted-foreground space-y-2">
            <Bell className="w-8 h-8 text-muted-foreground/40 mx-auto" />
            <p className="font-semibold text-foreground">All caught up!</p>
            <p>No new notifications at this time.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`p-5 flex items-start justify-between gap-4 transition-colors ${
                n.read ? 'bg-card' : 'bg-amber-50/40'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary mt-0.5">
                  {n.type === 'open_slot' ? (
                    <Sparkles className="w-5 h-5 text-amber-500" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-foreground">{n.title}</span>
                    {!n.read && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        New
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {n.message}
                  </p>
                  {n.type === 'open_slot' && (
                    <div className="pt-2">
                      <Link
                        href="/faculty/open-slots"
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors shadow-xs"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Go to Open Slots Feed</span>
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {!n.read && (
                <button
                  onClick={() => markAsRead(n.id)}
                  className="p-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted flex items-center gap-1"
                  title="Mark as read"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
