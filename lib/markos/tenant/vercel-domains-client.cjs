'use strict';

const VERCEL_DOMAINS_BASE = 'https://api.vercel.com/v10';

function buildUrl(projectId, path, teamId) {
  const base = `${VERCEL_DOMAINS_BASE}/projects/${encodeURIComponent(projectId)}/domains${path}`;
  return teamId ? `${base}?teamId=${encodeURIComponent(teamId)}` : base;
}

function getFetch(fetchImpl) {
  const f = fetchImpl || (typeof fetch !== 'undefined' ? fetch : null);
  if (!f) throw new Error('vercel-domains-client: no fetch available');
  return f;
}

async function addDomain(input, options = {}) {
  const { token, projectId, teamId, domain } = input || {};
  if (!token || !projectId || !domain) return { ok: false, status: 0, error: 'invalid_input' };

  const f = getFetch(options.fetchImpl);
  try {
    const resp = await f(buildUrl(projectId, '', teamId), {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: domain }),
    });
    if (!resp || !resp.ok) return { ok: false, status: (resp && resp.status) || 0, error: 'vercel_error' };
    const body = await resp.json().catch(() => ({}));
    return {
      ok: true,
      vercel_domain_id: body.id || body.name || domain,
      verification: Array.isArray(body.verification) ? body.verification : [],
    };
  } catch (e) {
    return { ok: false, status: 0, error: e && e.message ? e.message : 'network_error' };
  }
}

async function removeDomain(input, options = {}) {
  const { token, projectId, teamId, domain } = input || {};
  if (!token || !projectId || !domain) return { ok: false, status: 0, error: 'invalid_input' };

  const f = getFetch(options.fetchImpl);
  try {
    const resp = await f(buildUrl(projectId, '/' + encodeURIComponent(domain), teamId), {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!resp || !resp.ok) return { ok: false, status: (resp && resp.status) || 0, error: 'vercel_error' };
    return { ok: true };
  } catch (e) {
    return { ok: false, status: 0, error: e && e.message ? e.message : 'network_error' };
  }
}

async function getDomainStatus(input, options = {}) {
  const { token, projectId, teamId, domain } = input || {};
  if (!token || !projectId || !domain) return { ok: false, status: 0, error: 'invalid_input' };

  const f = getFetch(options.fetchImpl);
  try {
    const resp = await f(buildUrl(projectId, '/' + encodeURIComponent(domain) + '/config', teamId), {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!resp || !resp.ok) return { ok: false, status: (resp && resp.status) || 0, error: 'vercel_error' };
    const body = await resp.json().catch(() => ({}));
    return {
      ok: true,
      verified: !!body.verified && !body.misconfigured,
      ssl_issued_at: body.sslIssuedAt || null,
      cname_target: Array.isArray(body.recommendedCNAME) && body.recommendedCNAME.length > 0
        ? body.recommendedCNAME[0]
        : (body.cnameTarget || null),
    };
  } catch (e) {
    return { ok: false, status: 0, error: e && e.message ? e.message : 'network_error' };
  }
}

module.exports = {
  VERCEL_DOMAINS_BASE,
  addDomain,
  removeDomain,
  getDomainStatus,
};
