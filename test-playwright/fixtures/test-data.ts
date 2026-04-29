import { randomBytes } from 'node:crypto';

/**
 * generateTestTenant — produce randomised test identifiers for one E2E run.
 * Uses crypto randomness so parallel CI shards cannot collide on slug.
 */
export function generateTestTenant() {
  const suffix = randomBytes(4).toString('hex');
  return {
    email: `e2e-${suffix}@example.com`,
    slug: `e2e${suffix}`,
    displayName: `E2E Test ${suffix}`,
  };
}

/**
 * fetchLatestMagicToken — retrieve the verification token written to
 * markos_unverified_signups by POST /api/auth/signup, using a Supabase
 * service-role client so no email delivery is needed.
 *
 * Requires MARKOS_E2E_TEST_MODE=1 and SUPABASE_SERVICE_ROLE_KEY in env.
 * Falls back to local Supabase defaults (http://127.0.0.1:54321) when
 * NEXT_PUBLIC_SUPABASE_URL is not set.
 */
export async function fetchLatestMagicToken(email: string): Promise<string | null> {
  const { createClient } = await import('@supabase/supabase-js');
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'service-role-key',
    { auth: { persistSession: false } },
  );
  const { data } = await client
    .from('markos_unverified_signups')
    .select('verification_token')
    .eq('email', email.toLowerCase())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.verification_token ?? null;
}
