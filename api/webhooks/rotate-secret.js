'use strict';

const { randomBytes } = require('node:crypto');

const { writeJson } = require('../../lib/markos/crm/api.cjs');
const { initOtel, withSpan, recordEvent } = require('../../lib/markos/observability/otel.cjs');
const { enqueueAuditStaging } = require('../../lib/markos/audit/writer.cjs');
const { rotateSecret } = require('../../lib/markos/webhooks/secret-vault.cjs');
const { createRuntimeContext, requireHostedSupabaseAuth } = require('../../onboarding/backend/runtime-context.cjs');

initOtel({ serviceName: 'markos' });

function writeJsonWithSpan(span, res, statusCode, payload) {
  span?.setAttribute('status_code', statusCode);
  return writeJson(res, statusCode, payload);
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      try {
        resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function resolveSupabase(deps) {
  if (deps?.supabase) return deps.supabase;
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('rotate-secret: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY required');
  }
  const { createClient } = require('@supabase/supabase-js');
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
    db: { schema: 'public' },
  });
}

function resolveActorRole(auth) {
  return auth?.iamRole || auth?.role || auth?.principal?.tenant_role || 'owner';
}

async function handleRotateSecret(req, res, deps = {}, span) {
  if (req.method !== 'POST') {
    res.setHeader?.('Allow', 'POST');
    return writeJsonWithSpan(span, res, 405, { error: 'method_not_allowed' });
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    return writeJsonWithSpan(span, res, 400, { error: 'invalid_json' });
  }

  const runtimeContext = deps.runtimeContext || createRuntimeContext(process.env);
  const auth = deps.auth || requireHostedSupabaseAuth({
    req,
    runtimeContext,
    operation: 'approve_write',
  });
  if (!auth.ok) {
    return writeJsonWithSpan(span, res, auth.status || 401, {
      error: auth.error || 'auth_required',
      message: auth.message || null,
    });
  }
  span?.setAttribute('tenant_id', auth.tenant_id);

  const subscription_id = body?.subscription_id;
  if (!subscription_id || typeof subscription_id !== 'string') {
    return writeJsonWithSpan(span, res, 400, { error: 'missing_subscription_id' });
  }
  span?.setAttribute('webhook_subscription_id', subscription_id);

  let supabase;
  try {
    supabase = resolveSupabase(deps);
  } catch (error) {
    return writeJsonWithSpan(span, res, 500, { error: 'supabase_unavailable', detail: error.message });
  }

  const { data: subscription, error: lookupError } = await supabase
    .from('markos_webhook_subscriptions')
    .select('id, tenant_id, secret_vault_ref')
    .eq('id', subscription_id)
    .maybeSingle();
  if (lookupError) return writeJsonWithSpan(span, res, 500, { error: 'lookup_failed', detail: lookupError.message });
  if (!subscription) return writeJsonWithSpan(span, res, 404, { error: 'not_found' });
  if (subscription.tenant_id !== auth.tenant_id) return writeJsonWithSpan(span, res, 403, { error: 'forbidden' });

  const newSecret = randomBytes(32).toString('hex');
  const rotatedAt = new Date().toISOString();

  let newVaultRef;
  try {
    newVaultRef = await (deps.rotateSecret || rotateSecret)(supabase, subscription_id, newSecret);
  } catch (error) {
    return writeJsonWithSpan(span, res, 500, { error: 'vault_error', detail: error.message });
  }

  const { error: updateError } = await supabase
    .from('markos_webhook_subscriptions')
    .update({
      secret_vault_ref: newVaultRef,
      updated_at: rotatedAt,
    })
    .eq('id', subscription_id);
  if (updateError) return writeJsonWithSpan(span, res, 500, { error: 'update_failed', detail: updateError.message });

  try {
    await (deps.enqueueAuditStaging || enqueueAuditStaging)(supabase, {
      tenant_id: auth.tenant_id,
      source_domain: 'webhooks',
      action: 'secret.rotated',
      actor_id: auth.principal?.id || 'unknown',
      actor_role: resolveActorRole(auth),
      payload: {
        subscription_id,
        vault_ref: newVaultRef,
      },
    });
  } catch (error) {
    return writeJsonWithSpan(span, res, 500, { error: 'audit_emit_failed', detail: error.message });
  }

  recordEvent('webhook.secret_rotated', {
    tenant_id: auth.tenant_id,
    webhook_subscription_id: subscription_id,
  });
  return writeJsonWithSpan(span, res, 200, {
    ok: true,
    subscription_id,
    plaintext_secret_show_once: newSecret,
    rotated_at: rotatedAt,
  });
}

module.exports = async function handler(req, res, deps = {}) {
  return withSpan('webhook.rotate_secret', { method: req.method }, async (span) => handleRotateSecret(req, res, deps, span));
};
module.exports.handleRotateSecret = handleRotateSecret;
