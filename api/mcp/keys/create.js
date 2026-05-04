'use strict';

const { createClient } = require('@supabase/supabase-js');
const { writeJson } = require('../../../lib/markos/crm/api.cjs');
const { enqueueAuditStaging } = require('../../../lib/markos/audit/writer.cjs');
const { createKey } = require('../../../lib/markos/mcp/api-keys.cjs');
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

async function handleCreateKey(req, res, deps = {}, span) {
  if (req.method !== 'POST') return writeJsonWithSpan(span, res, 405, { error: 'method_not_allowed' });

  const runtime = createRuntimeContext();
  const auth = requireHostedSupabaseAuth({ req, runtimeContext: runtime, operation: 'status_read' });
  if (!auth.ok) {
    return writeJsonWithSpan(span, res, auth.status, { error: auth.error, message: auth.message });
  }
  span?.setAttribute('tenant_id', auth.tenant_id);

  const body = await readJson(req);
  const label = typeof body.label === 'string' && body.label.trim() ? body.label.trim() : 'Claude Desktop';
  const scopes = Array.isArray(body.scopes) ? body.scopes : [];

  const supabase = getSupabase(deps);
  let created;
  try {
    created = await createKey(
      supabase,
      auth.tenant_id,
      label,
      scopes,
      auth.principal && auth.principal.id ? auth.principal.id : 'unknown',
    );
  } catch (error) {
    return writeJsonWithSpan(span, res, 500, { error: 'create_failed', message: error.message || String(error) });
  }

  try {
    await enqueueAuditStaging(supabase, {
      tenant_id: auth.tenant_id,
      source_domain: 'mcp',
      action: 'api_key.created',
      actor_id: auth.principal && auth.principal.id ? auth.principal.id : 'unknown',
      actor_role: auth.role || 'member',
      payload: {
        id: created.id,
        label: created.label,
        scopes: created.scopes,
      },
    });
  } catch (error) {
    return writeJsonWithSpan(span, res, 500, { error: 'audit_emit_failed', message: error.message || String(error) });
  }

  return writeJsonWithSpan(span, res, 201, {
    id: created.id,
    label: created.label,
    scopes: created.scopes,
    created_at: created.created_at,
    key_fingerprint: created.key_fingerprint,
    plaintext_token_show_once: created.plaintext_token_show_once,
  });
}

module.exports = async function handler(req, res, deps = {}) {
  return withSpan('mcp.keys.create', { method: req.method }, async (span) => handleCreateKey(req, res, deps, span));
};
module.exports.handleCreateKey = handleCreateKey;
