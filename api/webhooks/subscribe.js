'use strict';

const { writeJson } = require('../../lib/markos/crm/api.cjs');
const { initOtel, withSpan } = require('../../lib/markos/observability/otel.cjs');
const { sanitizeSubscriptionRow, subscribe } = require('../../lib/markos/webhooks/engine.cjs');
const { getWebhookStores } = require('../../lib/markos/webhooks/store.cjs');
const { validateWebhookUrl } = require('../../lib/markos/webhooks/url-validator.cjs');
const { PLAN_TIER_RPS, resolvePerSubRps } = require('../../lib/markos/webhooks/rate-limit.cjs');

initOtel({ serviceName: 'markos' });

function writeJsonWithSpan(span, res, statusCode, payload) {
  span?.setAttribute('status_code', statusCode);
  return writeJson(res, statusCode, payload);
}

function resolveTenantId(req) {
  const auth = (req && (req.markosAuth || req.tenantContext)) || {};
  return auth.tenant_id || auth.principal?.tenant_id || auth.tenantId;
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      try {
        resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

// Phase 203-02 Task 1: SSRF guard at subscribe-time. Extracted so handleSubscribe
// stays under the 15-complexity threshold (S3776).
async function checkSsrfOrReject(span, res, url) {
  if (typeof url !== 'string') return null; // nothing to check — engine.cjs will reject shape later
  const validation = await validateWebhookUrl(url, {
    allowLocalhostHttp: process.env.MARKOS_WEBHOOK_ALLOW_LOCALHOST_HTTP === '1',
  });
  if (!validation.ok) {
    writeJsonWithSpan(span, res, 400, {
      success: false,
      error: 'invalid_subscriber_url',
      reason: validation.reason,
      detail: validation.detail,
    });
    return 'rejected';
  }
  return null;
}

// Phase 203-07 Task 1: rps_override validation (D-13). Returns either
//   { error: 'writeJson called' } when a response has been written, or
//   { rps_override } on success. Keeps handleSubscribe flat.
function validateRpsOverride(span, res, rawOverride, plan_tier) {
  if (rawOverride === undefined || rawOverride === null) {
    return { rps_override: null };
  }
  if (typeof rawOverride !== 'number' || !Number.isFinite(rawOverride) || rawOverride < 1) {
    writeJsonWithSpan(span, res, 400, { success: false, error: 'invalid_rps_override' });
    return { rejected: true };
  }
  const ceiling = Object.hasOwn(PLAN_TIER_RPS, plan_tier)
    ? PLAN_TIER_RPS[plan_tier]
    : PLAN_TIER_RPS.free;
  if (rawOverride > ceiling) {
    writeJsonWithSpan(span, res, 400, { success: false, error: 'rps_override_exceeds_plan', ceiling });
    return { rejected: true };
  }
  return { rps_override: rawOverride };
}

async function handleSubscribe(req, res, span) {
  if (req.method !== 'POST') return writeJsonWithSpan(span, res, 405, { success: false, error: 'METHOD_NOT_ALLOWED' });

  const tenantId = resolveTenantId(req);
  if (!tenantId) return writeJsonWithSpan(span, res, 401, { success: false, error: 'TENANT_CONTEXT_REQUIRED' });
  span?.setAttribute('tenant_id', tenantId);

  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    return writeJsonWithSpan(span, res, 400, { success: false, error: 'INVALID_JSON' });
  }

  // SSRF guard (BEFORE insert). Error body matches UI-SPEC Surface-1 locked copy.
  if (body && typeof body.url === 'string') {
    const ssrfOutcome = await checkSsrfOrReject(span, res, body.url);
    if (ssrfOutcome === 'rejected') return;
  }

  // rps_override (D-13).
  const plan_tier = (typeof body?.plan_tier === 'string' && body.plan_tier) || 'free';
  const validation = validateRpsOverride(span, res, body?.rps_override, plan_tier);
  if (validation.rejected) return;
  const { rps_override } = validation;

  const { subscriptions } = getWebhookStores();
  try {
    const result = await subscribe(subscriptions, {
      tenant_id: tenantId,
      url: body.url,
      events: body.events,
      secret: body.secret,
      rps_override,
    });
    span?.setAttribute('webhook_subscription_id', result.subscription.id);
    return writeJsonWithSpan(span, res, 201, {
      success: true,
      subscription_id: result.subscription.id,
      subscription: sanitizeSubscriptionRow(result.subscription),
      plaintext_secret_show_once: result.plaintext_secret_show_once,
    });
  } catch (error) {
    if (String(error?.message || '').startsWith('invalid_subscriber_url:')) {
      const [, reason = 'invalid_subscriber_url', detail = ''] = String(error.message).split(':');
      return writeJsonWithSpan(span, res, 400, {
        success: false,
        error: 'invalid_subscriber_url',
        reason,
        detail: detail || null,
      });
    }
    return writeJsonWithSpan(span, res, 400, { success: false, error: error.message });
  }
}

module.exports = async function handler(req, res) {
  return withSpan('webhook.subscribe', { method: req.method }, async (span) => handleSubscribe(req, res, span));
};
module.exports.handleSubscribe = handleSubscribe;
// Expose for tests + dependents that want to validate at the same layer.
module.exports.resolvePerSubRps = resolvePerSubRps;
module.exports.PLAN_TIER_RPS = PLAN_TIER_RPS;
