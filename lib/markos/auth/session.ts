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