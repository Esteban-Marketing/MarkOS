import { headers } from 'next/headers';
import styles from './page.module.css';
import LoginCard from './_components/LoginCard';

export const dynamic = 'force-dynamic';

async function fetchBranding(tenantId: string | null) {
  if (!tenantId) return null;
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } },
    );
    const { getTenantBranding } = await import('../../../lib/markos/tenant/branding.cjs');
    return await getTenantBranding(client, tenantId);
  } catch {
    return null;
  }
}

export default async function LoginPage() {
  const h = await headers();
  const isByod = h.get('x-markos-byod') === '1';
  const tenantId = h.get('x-markos-tenant-id');

  const branding = isByod ? await fetchBranding(tenantId) : null;
  const displayName = branding?.display_name || 'MarkOS';
  const logo = branding?.logo_url || null;

  // Surface 7: only show tenant-branded chrome when vanity_login_enabled + verified BYOD.
  const useTenantChrome = Boolean(isByod && branding && branding.vanity_login_enabled);

  return (
    <main className={styles.page}>
      <LoginCard
        useTenantChrome={useTenantChrome}
        displayName={displayName}
        logo={logo}
      />
    </main>
  );
}
