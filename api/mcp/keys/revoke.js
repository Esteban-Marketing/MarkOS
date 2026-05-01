'use strict';

const { createClient } = require('@supabase/supabase-js');
const { writeJson } = require('../../../lib/markos/crm/api.cjs');
const { enqueueAuditStaging } = require('../../../lib/markos/audit/writer.cjs');
const { revokeKey } = require('../../../lib/markos/mcp/api-keys.cjs');
const { initOtel, withSpan } = require('../../../lib/markos/observability/otel.cjs');
const { createRuntimeContext, requireHostedSupabaseAuth } = require('../../../onboarding/backend/runtime-context.cjs');

initOtel({ serviceName: 'markos' });

function writeJsonWithSpan(span, res, statusCode, payload) {
  span?.setAttribute('status_code', statusCode);
  return writeJson(res, statusCode, payload);
}

async function readJson(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  const chunks = [];
  return new Promise((resolve) => {
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      try {
        resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

function getSupabase(deps) {
  if (deps && deps.supabase) return deps.supabase;
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'anon-key',
    { auth: { persistSession: false } },
  );
}

async function handleRevokeKey(req, res, deps = {}, span) {
  if (req.method !== 'POST') return writeJsonWithSpan(span, res, 405, { error: 'method_not_allowed' });

  const runtime = createRuntimeContext();
  const auth = requireHostedSupabaseAuth({ req, runtimeContext: runtime, operation: 'status_read' });
  if (!auth.ok) {
    return writeJsonWithSpan(span, res, auth.status, { error: auth.error, message: auth.message });
  }
  span?.setAttribute('tenant_id', auth.tenant_id);

  const body = await readJson(req);
  if (!body.id) return writeJsonWithSpan(span, res, 400, { error: 'missing_id' });

  const supabase = getSupabase(deps);
  let result;
  try {
    result = await revokeKey(supabase, auth.tenant_id, body.id);
  } catch (error) {
    if (error.message === 'key_not_found') return writeJsonWithSpan(span, res, 404, { error: 'key_not_found' });
    if (error.message === 'cross_tenant_forbidden') return writeJsonWithSpan(span, res, 403, { error: 'cross_tenant_forbidden' });
    return writeJsonWithSpan(span, res, 500, { error: 'revoke_failed', message: error.message || String(error) });
  }

  try {
    await enqueueAuditStaging(supabase, {
      tenant_id: auth.tenant_id,
      source_domain: 'mcp',
      action: 'api_key.revoked',
      actor_id: auth.principal && auth.principal.id ? auth.principal.id : 'unknown',
      actor_role: auth.role || 'member',
      payload: {
        id: body.id,
        revoked_at: result.revoked_at,
      },
    });
  } catch (error) {
    return writeJsonWithSpan(span, res, 500, { error: 'audit_emit_failed', message: error.message || String(error) });
  }

  return writeJsonWithSpan(span, res, 200, { ok: true, revoked_at: result.revoked_at });
}

module.exports = async function handler(req, res, deps = {}) {
  return withSpan('mcp.keys.revoke', { method: req.method }, async (span) => handleRevokeKey(req, res, deps, span));
};
module.exports.handleRevokeKey = handleRevokeKey;
