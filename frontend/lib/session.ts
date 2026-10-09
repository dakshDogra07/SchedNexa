import type { DemoUser, UserRole } from '@shared/types';

export interface SessionData {
  userId: string;
  name: string;
  role: UserRole;
  facultyId?: string;
}

const SESSION_COOKIE_NAME = 'schednexa_session';

export const DEMO_PROFILES: SessionData[] = [
  {
    userId: '10000000-0000-0000-0000-000000000001',
    name: 'Admin',
    role: 'admin',
  },
  {
    userId: '10000000-0000-0000-0000-000000000002',
    name: 'Dr. Sharma',
    role: 'faculty',
    facultyId: '20000000-0000-0000-0000-000000000001',
  },
  {
    userId: '10000000-0000-0000-0000-000000000003',
    name: 'Prof. Kaur',
    role: 'faculty',
    facultyId: '20000000-0000-0000-0000-000000000002',
  },
];

export function getSession(): SessionData | null {
  if (typeof document === 'undefined') return null;

  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [key, value] = cookie.trim().split('=');
    if (key === SESSION_COOKIE_NAME && value) {
      try {
        return JSON.parse(decodeURIComponent(value));
      } catch {
        return null;
      }
    }
  }
  return null;
}

export function setSession(session: SessionData): void {
  if (typeof document === 'undefined') return;
  const json = encodeURIComponent(JSON.stringify(session));
  // Set cookie for 7 days
  document.cookie = `${SESSION_COOKIE_NAME}=${json}; path=/; max-age=604800; SameSite=Lax`;
}

export function clearSession(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${SESSION_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
}
