// Phase 201 Plan 05: Vercel Routing Middleware — the first middleware.ts in the repo.
// Decisions: D-09 (wildcard + slug resolution), D-10 (404 for unclaimed; reserved-slug routing),
//            D-12 (BYOD pass-through — full DNS/SSL flow is Plan 06).
// Pitfall 5 guard: BYOD routing only happens after markos_custom_domains.status='verified'
//                  (enforced inside resolveTenantByDomain).
//
// This middleware runs on every request matched by config.matcher. Keep it CHEAP.

import { NextResponse, type NextRequest } from 'next/server';
import { resolveHost } from './lib/markos/tenant/resolver';

const APEX = process.env.NEXT_PUBLIC_APEX_DOMAIN || 'markos.dev';

// Dynamic import for Supabase so tests + edge runtime both work.
async function createServiceClient() {
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'anon-key',
    { auth: { persistSession: false } },
  );
}

export async function middleware(req: NextRequest): Promise<NextResponse> {
  const host = req.headers.get('host') || '';
  const url = req.nextUrl.clone();

  const resolution = resolveHost(host, APEX);

  // Layer 1: bare / system hosts pass through untouched.
  if (resolution.kind === 'bare' || resolution.kind === 'system') {
    return NextResponse.next();
  }

  // Layer 2a: reserved first-party subdomain → /404-workspace?reserved=1
  if (resolution.kind === 'reserved') {
    url.pathname = '/404-workspace';
    url.searchParams.set('reserved', '1');
    url.searchParams.set('slug', resolution.slug || '');
    return NextResponse.rewrite(url);
  }

  // Layer 2b: first-party slug → resolve to tenant
  if (resolution.kind === 'first_party') {
    const slug = resolution.slug || '';

    // Phase 201 Plan 08 Task 3: edge-config cache in front of Supabase (T-201-05-06 mitigation).
    // Read-through: cache hit short-circuits the Supabase round-trip.
    const { readSlugFromEdge, writeSlugToEdge } = await import('./lib/markos/tenant/slug-cache.cjs');
    const cachedTenantId = await readSlugFromEdge(slug);

    if (cachedTenantId) {
      const headers = new Headers(req.headers);
      headers.set('x-markos-tenant-id', cachedTenantId);
      headers.set('x-markos-tenant-slug', slug);
      // org_id is not cached at this layer (keeps the edge-config value a simple string).
      // Downstream handlers requiring org_id already re-fetch via supabase when needed.
      headers.set('x-markos-byod', '0');
      return NextResponse.next({ request: { headers } });
    }

    const client = await createServiceClient();
    const { resolveTenantBySlug } = await import('./lib/markos/tenant/resolver');
    const tenant = await resolveTenantBySlug(client, slug);
    if (!tenant) {
      url.pathname = '/404-workspace';
      url.searchParams.set('slug', slug);
      return NextResponse.rewrite(url);
    }

    // Backfill the edge-config cache (fire-and-forget; never blocks the response).
    if (tenant.status === 'active') {
      writeSlugToEdge(slug, tenant.tenant_id).catch(() => {});
    }

    const headers = new Headers(req.headers);
    headers.set('x-markos-tenant-id', tenant.tenant_id);
    headers.set('x-markos-tenant-slug', slug);
    headers.set('x-markos-org-id', tenant.org_id);
    headers.set('x-markos-byod', '0');
    return NextResponse.next({ request: { headers } });
  }

  // Layer 2c: BYOD custom domain → resolve via markos_custom_domains (status=verified only)
  if (resolution.kind === 'byod') {
    const client = await createServiceClient();
    const { resolveTenantByDomain } = await import('./lib/markos/tenant/resolver');
    const tenant = await resolveTenantByDomain(client, resolution.host);
    if (!tenant) {
      // Unverified BYOD — return next() so Next.js 404 handler runs (owner hasn't finished DNS).
      return NextResponse.next();
    }
    const headers = new Headers(req.headers);
    headers.set('x-markos-tenant-id', tenant.tenant_id);
    headers.set('x-markos-org-id', tenant.org_id);
    headers.set('x-markos-byod', '1');
    headers.set('x-markos-custom-domain', resolution.host);
    return NextResponse.next({ request: { headers } });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Run on everything except static assets.
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
