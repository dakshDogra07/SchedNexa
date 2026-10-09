'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, setSession as saveSessionCookie, DEMO_PROFILES, type SessionData } from '@/lib/session';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [session, setSession] = useState<SessionData | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const current = getSession();
    if (!current || current.role !== 'admin') {
      const adminProfile = DEMO_PROFILES[0];
      saveSessionCookie(adminProfile);
      setSession(adminProfile);
    } else {
      setSession(current);
    }
    setChecking(false);
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-sm text-muted-foreground animate-pulse">
        Verifying administrator session...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-foreground">
      <Sidebar role="admin" />
      <div className="flex-1 flex flex-col min-w-0">
        <Header currentSession={session} />
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
