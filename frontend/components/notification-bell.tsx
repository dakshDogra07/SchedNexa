'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/lib/use-notifications';
import {
  Bell,
  Sparkles,
  CheckCircle2,
  CalendarCheck,
  FlaskConical,
  Check,
  ExternalLink,
} from 'lucide-react';

export function NotificationBell({ userId }: { userId?: string }) {
  const router = useRouter();
  const { notifications, unreadCount, markAsRead } = useNotifications(userId);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'open_slot':
        return <Sparkles className="w-4 h-4 text-amber-500" />;
      case 'booking_confirmed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'lab_booking':
        return <FlaskConical className="w-4 h-4 text-blue-500" />;
      default:
        return <Bell className="w-4 h-4 text-primary" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-black text-white shadow-xs animate-bounce">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 rounded-2xl border border-border bg-card shadow-2xl z-50 overflow-hidden animate-scale-in">
          <div className="p-3.5 border-b border-border bg-muted/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-foreground">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800">
                  {unreadCount} new
                </span>
              )}
            </div>
            <Link
              href="/faculty/notifications"
              onClick={() => setOpen(false)}
              className="text-[11px] font-medium text-primary hover:underline"
            >
              View all
            </Link>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-border/60">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                No notifications right now.
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  className={`p-3.5 transition-colors text-left space-y-1.5 ${
                    item.read ? 'bg-card' : 'bg-amber-50/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {getIcon(item.type)}
                      <span className="text-xs font-bold text-foreground">
                        {item.title}
                      </span>
                    </div>
                    {!item.read && (
                      <button
                        onClick={() => markAsRead(item.id)}
                        className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-0.5 p-1 rounded hover:bg-muted"
                        title="Mark read"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {item.message}
                  </p>

                  {item.type === 'open_slot' && (
                    <div className="pt-1">
                      <button
                        onClick={() => {
                          markAsRead(item.id);
                          setOpen(false);
                          router.push('/faculty/open-slots');
                        }}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Claim Open Slot Now</span>
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
