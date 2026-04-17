import { createServerClient } from '@supabase/ssr';

export const SESSION_REQUIRED = 'SESSION_REQUIRED';
export const TENANT_CONTEXT_MISSING = 'TENANT_CONTEXT_MISSING';

export type MarkosSession = {
  userId: string;
  tenantId: string | null;
  role: string | null;
  accessToken: string | null;
};

export type ActiveTenantContext = {
  tenantId: string;
  role: string;
};

export function createMarkosServerClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'anon-key',
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {},
      },
    },
  );
}

export async function requireMarkosSession(): Promise<MarkosSession> {
  createMarkosServerClient();

  const tenantId = process.env.MARKOS_ACTIVE_TENANT_ID || null;
  const role = process.env.MARKOS_ACTIVE_ROLE || 'owner';

  return {
    userId: process.env.MARKOS_ACTIVE_USER_ID || 'session-user',
    tenantId,
    role,
    accessToken: null,
  };
}

export async function getActiveTenantContext(session: MarkosSession): Promise<ActiveTenantContext | null> {
  if (!session) {
    throw new Error(SESSION_REQUIRED);
  }

  if (!session.tenantId) {
    throw new Error(TENANT_CONTEXT_MISSING);
  }

  return {
    tenantId: session.tenantId,
    role: session.role || 'readonly',
  };
}

// === Phase 201 Plan 05: 30-day rolling session (D-04) ===
// Additive — existing createMarkosServerClient + requireMarkosSession + getActiveTenantContext stay intact.

export const SESSION_IDLE_EXTENDS_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
export const SESSION_DEVICE_COOKIE = 'markos_session_device_id';

export interface SessionDeviceRecord {
  session_id: string;
  user_id: string;
  tenant_id: string;
  device_label: string | null;
  user_agent: string | null;
  ip_hash: string | null;
  last_seen_at: string;
  revoked_at: string | null;
  created_at: string;
}

// Thin update helper — does not spin up a Supabase client. Caller passes one.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function refreshRollingSession(client: any, input: { session_id: string }): Promise<void> {
  if (!client || typeof client.from !== 'function') return;
  await client
    .from('markos_sessions_devices')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('session_id', input.session_id)
    .is('revoked_at', null);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function revokeSessionDevice(client: any, input: { session_id: string; user_id: string }): Promise<{ revoked: boolean }> {
  if (!client || typeof client.from !== 'function') return { revoked: false };
  const { data, error } = await client
    .from('markos_sessions_devices')
    .update({ revoked_at: new Date().toISOString() })
    .eq('session_id', input.session_id)
    .eq('user_id', input.user_id)
    .is('revoked_at', null)
    .select('session_id');
  if (error) return { revoked: false };
  return { revoked: Array.isArray(data) ? data.length > 0 : !!data };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function revokeAllOtherSessionDevices(client: any, input: { user_id: string; keep_session_id: string }): Promise<{ revoked_count: number }> {
  if (!client || typeof client.from !== 'function') return { revoked_count: 0 };
  const { data, error } = await client
    .from('markos_sessions_devices')
    .update({ revoked_at: new Date().toISOString() })
    .eq('user_id', input.user_id)
    .neq('session_id', input.keep_session_id)
    .is('revoked_at', null)
    .select('session_id');
  if (error) return { revoked_count: 0 };
  return { revoked_count: Array.isArray(data) ? data.length : 0 };
}