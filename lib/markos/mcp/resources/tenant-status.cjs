'use strict';

// Phase 202 Plan 08 — MCP Resource: tenant health snapshot.
// URI: mcp://markos/tenant/status (no {tenant} placeholder — always resolves to session.tenant_id).
// Aggregates markos_tenants.status + active session count + 24h spend + plan-tier cap.

const uriTemplate = 'mcp://markos/tenant/status';
const URI_RE = /^mcp:\/\/markos\/tenant\/status$/;

function parseUri(uri) {
  if (typeof uri !== 'string') return null;
  return URI_RE.test(uri) ? {} : null;
}

async function resolve({ uri, session, supabase, deps }) {
  if (!parseUri(uri)) return { error: 'resource_not_found' };
  const tenant_id = session.tenant_id;
  const plan_tier = session.plan_tier;

  let status = 'unknown';
  let active_sessions = 0;
  let spent_cents_24h = 0;
  let cap_cents = 0;

  // markos_tenants status
  try {
    if (supabase && typeof supabase.from === 'function') {
      const q = supabase.from('markos_tenants').select('status, slug').eq('id', tenant_id);
      const res = await (q.maybeSingle ? q.maybeSingle() : Promise.resolve({ data: null }));
      if (res && res.data && res.data.status) status = res.data.status;
    }
  } catch { /* best-effort */ }

  // markos_mcp_sessions count (active, not revoked)
  try {
    if (supabase && typeof supabase.from === 'function') {
      const sel = supabase
        .from('markos_mcp_sessions')
        .select('id', { count: 'exact' })
        .eq('tenant_id', tenant_id)
        .is('revoked_at', null);
      const res = await (typeof sel.then === 'function' ? sel : Promise.resolve(sel));
      if (res && Array.isArray(res.data)) active_sessions = res.data.length;
      else if (res && typeof res.count === 'number') active_sessions = res.count;
    }
  } catch { /* best-effort */ }

  // 24h spend from cost-meter
  try {
    if (deps && typeof deps.readCurrentSpendCents === 'function') {
      const r = await deps.readCurrentSpendCents(supabase, tenant_id);
      if (r && typeof r.spent_cents === 'number') spent_cents_24h = r.spent_cents;
    } else {
      const mod = require('../cost-meter.cjs');
      if (typeof mod.readCurrentSpendCents === 'function') {
        const r = await mod.readCurrentSpendCents(supabase, tenant_id);
        if (r && typeof r.spent_cents === 'number') spent_cents_24h = r.spent_cents;
      }
    }
  } catch { /* best-effort */ }

  // Plan-tier cap
  try {
    if (deps && typeof deps.capCentsForPlanTier === 'function') {
      cap_cents = deps.capCentsForPlanTier(plan_tier) || 0;
    } else {
      const mod = require('../cost-table.cjs' ).capCentsForPlanTier ? require('../cost-table.cjs') : null;
      if (mod && typeof mod.capCentsForPlanTier === 'function') {
        cap_cents = mod.capCentsForPlanTier(plan_tier) || 0;
      }
    }
  } catch { /* best-effort */ }

  return {
    contents: [
      {
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(
          {
            tenant_id,
            status,
            plan_tier,
            active_sessions,
            spent_cents_24h,
            cap_cents,
            as_of: new Date().toISOString(),
          },
          null,
          2,
        ),
      },
    ],
  };
}

module.exports = { uriTemplate, parseUri, resolve };
