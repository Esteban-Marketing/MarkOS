import { headers } from 'next/headers';
import styles from './page.module.css';

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
  const primary = branding?.primary_color || '#0d9488';
  const displayName = branding?.display_name || 'MarkOS';
  const logo = branding?.logo_url || null;

  // Surface 7: only show tenant-branded chrome when vanity_login_enabled + verified BYOD.
  const useTenantChrome = isByod && branding && branding.vanity_login_enabled;

  return (
    <main className={styles.page} style={{ '--accent': primary } as React.CSSProperties}>
      <section className={styles.authCard} aria-labelledby="login-heading">
        {useTenantChrome && logo && (
          <img src={logo} alt={`${displayName} logo`} className={styles.logo} />
        )}
        <h1 id="login-heading" className={styles.heading}>
          {useTenantChrome ? `Sign in to ${displayName}` : 'Sign in'}
        </h1>
        <form className={styles.form} method="POST" action="/api/auth/signup">
          <label htmlFor="email" className={styles.label}>Email</label>
          <input id="email" name="email" type="email" required className={styles.input} />
          <button type="submit" className={styles.primaryCta}>Send magic link</button>
        </form>
        {useTenantChrome && (
          <a
            href="https://markos.dev"
            className={styles.poweredBy}
            aria-label="Powered by MarkOS — open markos.dev"
          >
            Powered by MarkOS
          </a>
        )}
      </section>
    </main>
  );
}
