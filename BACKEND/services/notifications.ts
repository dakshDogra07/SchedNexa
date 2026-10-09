/**
 * services/notifications.ts — In-app notification services.
 *
 * Implements:
 *   - getNotifications
 *   - markNotificationRead
 */

import type { ApiResult, Notification } from '@shared/types';
import { db } from '../lib/db.js';
import {
  GetNotificationsInput,
  MarkNotificationReadInput,
} from '../schemas.js';

// ─── getNotifications ───────────────────────────────────────────────

export async function getNotifications(
  input: unknown
): Promise<ApiResult<Notification[]>> {
  try {
    const parsed = GetNotificationsInput.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: `Invalid input: ${parsed.error.issues.map((i) => i.message).join('; ')}`,
      };
    }

    const { userId } = parsed.data;

    // Verify user exists in users table
    const { data: user, error: userErr } = await db()
      .from('users')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (userErr || !user) {
      return { ok: false, error: 'User not found' };
    }

    const { data, error } = await db()
      .from('notifications')
      .select('id, user_id, title, message, type, related_id, read, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return { ok: false, error: `Failed to fetch notifications: ${error.message}` };
    }

    return { ok: true, data: (data || []) as Notification[] };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `getNotifications failed: ${message}` };
  }
}

// ─── markNotificationRead ────────────────────────────────────────────

export async function markNotificationRead(
  input: unknown
): Promise<ApiResult<{ done: true }>> {
  try {
    const parsed = MarkNotificationReadInput.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: `Invalid input: ${parsed.error.issues.map((i) => i.message).join('; ')}`,
      };
    }

    const { notificationId } = parsed.data;

    // Check if notification exists
    const { data: notif, error: notifErr } = await db()
      .from('notifications')
      .select('id')
      .eq('id', notificationId)
      .maybeSingle();

    if (notifErr || !notif) {
      return { ok: false, error: 'Notification not found' };
    }

    const { error: updErr } = await db()
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (updErr) {
      return { ok: false, error: `Failed to mark notification as read: ${updErr.message}` };
    }

    return { ok: true, data: { done: true } };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `markNotificationRead failed: ${message}` };
  }
}
