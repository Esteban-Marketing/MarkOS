'use strict';

const { createClient } = require('@supabase/supabase-js');
const { writeJson } = require('../../../lib/markos/crm/api.cjs');
const { enqueueAuditStaging } = require('../../../lib/markos/audit/writer.cjs');
const { listKeys } = require('../../../lib/markos/mcp/api-keys.cjs');
const { initOtel, withSpan } = require('../../../lib/markos/observability/otel.cjs');
const { createRuntimeContext, requireHostedSupabaseAuth } = require('../../../onboarding/backend/runtime-context.cjs');

initOtel({ serviceName: 'markos' });

function writeJsonWithSpan(span, res, statusCode, payload) {
  span?.setAttribute('status_code', statusCode);
  return writeJson(res, statusCode, payload);
}

function getSupabase(deps) {
  if (deps && deps.supabase) return deps.supabase;
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'anon-key',
    { auth: { persistSession: false } },
  );
}

async function handleListKeys(req, res, deps = {}, span) {
  if (req.method !== 'GET') return writeJsonWithSpan(span, res, 405, { error: 'method_not_allowed' });

  const runtime = createRuntimeContext();
  const auth = requireHostedSupabaseAuth({ req, runtimeContext: runtime, operation: 'status_read' });
  if (!auth.ok) {
    return writeJsonWithSpan(span, res, auth.status, { error: auth.error, message: auth.message });
  }
  span?.setAttribute('tenant_id', auth.tenant_id);

  const supabase = getSupabase(deps);

  try {
    const keys = await listKeys(supabase, auth.tenant_id);
    enqueueAuditStaging(supabase, {
      tenant_id: auth.tenant_id,
      source_domain: 'mcp',
      action: 'api_key.listed',
      actor_id: auth.principal && auth.principal.id ? auth.principal.id : 'unknown',
      actor_role: auth.role || 'member',
      payload: { count: keys.length },
    }).catch(() => {});
    return writeJsonWithSpan(span, res, 200, { keys });
  } catch (error) {
    return writeJsonWithSpan(span, res, 500, { error: 'list_failed', message: error.message || String(error) });
  }
}

module.exports = async function handler(req, res, deps = {}) {
  return withSpan('mcp.keys.list', { method: req.method }, async (span) => handleListKeys(req, res, deps, span));
};
module.exports.handleListKeys = handleListKeys;
