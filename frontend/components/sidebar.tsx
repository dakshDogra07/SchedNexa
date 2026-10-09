'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  BarChart3,
  DoorOpen,
  Sparkles,
  FileSpreadsheet,
  Settings,
  LineChart,
  CalendarPlus,
  FlaskConical,
  Bell,
  GraduationCap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserRole } from '@shared/types';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ADMIN_NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Timetable', href: '/admin/timetable', icon: Calendar },
  { label: 'Workload', href: '/admin/workload', icon: BarChart3 },
  { label: 'Rooms & Labs', href: '/admin/rooms', icon: DoorOpen },
  { label: 'Open Slots', href: '/admin/open-slots', icon: Sparkles },
  { label: 'Analytics', href: '/admin/analytics', icon: LineChart },
  { label: 'Setup', href: '/admin/setup', icon: Settings },
  { label: 'Reports', href: '/admin/reports', icon: FileSpreadsheet },
];

const FACULTY_NAV_ITEMS: NavItem[] = [
  { label: 'My Dashboard', href: '/faculty', icon: LayoutDashboard },
  { label: 'My Timetable', href: '/faculty/timetable', icon: Calendar },
  { label: 'Mark Leave', href: '/faculty/leave', icon: CalendarPlus },
  { label: 'Open Slots', href: '/faculty/open-slots', icon: Sparkles },
  { label: 'Book Lab', href: '/faculty/labs', icon: FlaskConical },
  { label: 'Notifications', href: '/faculty/notifications', icon: Bell },
];

export function Sidebar({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const items = role === 'admin' ? ADMIN_NAV_ITEMS : FACULTY_NAV_ITEMS;

  return (
    <aside className="w-64 border-r border-border bg-card flex flex-col h-screen sticky top-0">
      {/* Brand Logo */}
      <div className="h-16 flex items-center px-6 border-b border-border gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-white font-bold shadow-sm">
          <GraduationCap className="w-5 h-5" />
        </div>
        <div>
          <span className="font-bold text-lg tracking-tight text-foreground block leading-tight">
            SchedNexa
          </span>
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
            {role === 'admin' ? 'Admin Portal' : 'Faculty Portal'}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-white shadow-sm font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              )}
            >
              <Icon className={cn('w-4 h-4', isActive ? 'text-white' : 'text-muted-foreground')} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-border bg-muted/20">
        <div className="text-[11px] text-muted-foreground">
          <p className="font-semibold text-foreground">SchedNexa Platform</p>
          <p className="truncate">Hackathon P0 Edition</p>
        </div>
      </div>
    </aside>
  );
}
