'use strict';

const { isReservedSlug } = require('./reserved-slugs.cjs');

const DEFAULT_APEX = process.env.NEXT_PUBLIC_APEX_DOMAIN || 'markos.dev';

const SYSTEM_SUBDOMAINS = Object.freeze(new Set([
  'www', 'api', 'app', 'admin', 'mcp', 'sdk', 'mail', 'status',
  'docs', 'blog', 'help', 'support', 'security', 'about', 'pricing', 'integrations',
]));

function normaliseHost(host) {
  if (typeof host !== 'string') return '';
  return host.trim().toLowerCase().replace(/:\d+$/, '');
}

function resolveHost(host, apex) {
  const apexDomain = (apex || DEFAULT_APEX).toLowerCase();
  const normalised = normaliseHost(host);
  if (!normalised) {
    return { kind: 'bare', host: normalised, apex: apexDomain };
  }
  if (normalised === apexDomain) {
    return { kind: 'bare', host: normalised, apex: apexDomain };
  }
  if (normalised.endsWith(`.${apexDomain}`)) {
    const slug = normalised.slice(0, normalised.length - apexDomain.length - 1);
    // A slug may itself contain dots (e.g. 'foo.bar.markos.dev'). We only accept single-label slugs
    // for first-party subdomains; multi-label lands on 'bare' as an anomaly.
    if (slug.indexOf('.') !== -1) {
      return { kind: 'bare', host: normalised, apex: apexDomain };
    }
    if (SYSTEM_SUBDOMAINS.has(slug)) {
      return { kind: 'system', host: normalised, apex: apexDomain, slug };
    }
    if (isReservedSlug(slug)) {
      return { kind: 'reserved', host: normalised, apex: apexDomain, slug, is_reserved: true };
    }
    return { kind: 'first_party', host: normalised, apex: apexDomain, slug };
  }
  return { kind: 'byod', host: normalised, apex: apexDomain };
}

async function resolveTenantBySlug(client, slug) {
  if (!client || typeof client.from !== 'function') return null;
  if (typeof slug !== 'string' || !slug) return null;

  const { data, error } = await client
    .from('markos_tenants')
    .select('id, org_id, status')
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle();
  if (error || !data) return null;
  return { tenant_id: data.id, org_id: data.org_id, status: data.status };
}

async function resolveTenantByDomain(client, domain) {
  if (!client || typeof client.from !== 'function') return null;
  if (typeof domain !== 'string' || !domain) return null;

  const { data, error } = await client
    .from('markos_custom_domains')
    .select('tenant_id, org_id, status, verified_at')
    .eq('domain', domain.toLowerCase())
    .eq('status', 'verified')
    .maybeSingle();
  if (error || !data) return null;
  return { tenant_id: data.tenant_id, org_id: data.org_id, status: data.status, verified_at: data.verified_at };
}

module.exports = {
  SYSTEM_SUBDOMAINS,
  DEFAULT_APEX,
  resolveHost,
  resolveTenantBySlug,
  resolveTenantByDomain,
};
