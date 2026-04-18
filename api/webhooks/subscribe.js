'use strict';

const { writeJson } = require('../../lib/markos/crm/api.cjs');
const { subscribe } = require('../../lib/markos/webhooks/engine.cjs');
const { getWebhookStores } = require('../../lib/markos/webhooks/store.cjs');
const { assertUrlIsPublic } = require('../../lib/markos/webhooks/ssrf-guard.cjs');
const { PLAN_TIER_RPS, resolvePerSubRps } = require('../../lib/markos/webhooks/rate-limit.cjs');

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
async function checkSsrfOrReject(res, url) {
  if (typeof url !== 'string') return null; // nothing to check — engine.cjs will reject shape later
  try {
    await assertUrlIsPublic(url);
    return null;
  } catch (ssrfErr) {
    const code = String(ssrfErr?.message || 'invalid_url').split(':')[0];
    writeJson(res, 400, { success: false, error: code });
    return 'rejected';
  }
}

// Phase 203-07 Task 1: rps_override validation (D-13). Returns either
//   { error: 'writeJson called' } when a response has been written, or
//   { rps_override } on success. Keeps handleSubscribe flat.
function validateRpsOverride(res, rawOverride, plan_tier) {
  if (rawOverride === undefined || rawOverride === null) {
    return { rps_override: null };
  }
  if (typeof rawOverride !== 'number' || !Number.isFinite(rawOverride) || rawOverride < 1) {
    writeJson(res, 400, { success: false, error: 'invalid_rps_override' });
    return { rejected: true };
  }
  const ceiling = Object.hasOwn(PLAN_TIER_RPS, plan_tier)
    ? PLAN_TIER_RPS[plan_tier]
    : PLAN_TIER_RPS.free;
  if (rawOverride > ceiling) {
    writeJson(res, 400, { success: false, error: 'rps_override_exceeds_plan', ceiling });
    return { rejected: true };
  }
  return { rps_override: rawOverride };
}

async function handleSubscribe(req, res) {
  if (req.method !== 'POST') return writeJson(res, 405, { success: false, error: 'METHOD_NOT_ALLOWED' });

  const tenantId = resolveTenantId(req);
  if (!tenantId) return writeJson(res, 401, { success: false, error: 'TENANT_CONTEXT_REQUIRED' });

  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    return writeJson(res, 400, { success: false, error: 'INVALID_JSON' });
  }

  // SSRF guard (BEFORE insert). Error body matches UI-SPEC Surface-1 locked copy.
  if (body && typeof body.url === 'string') {
    const ssrfOutcome = await checkSsrfOrReject(res, body.url);
    if (ssrfOutcome === 'rejected') return;
  }

  // rps_override (D-13).
  const plan_tier = (typeof body?.plan_tier === 'string' && body.plan_tier) || 'free';
  const validation = validateRpsOverride(res, body?.rps_override, plan_tier);
  if (validation.rejected) return;
  const { rps_override } = validation;

  const { subscriptions } = getWebhookStores();
  try {
    const row = await subscribe(subscriptions, {
      tenant_id: tenantId,
      url: body.url,
      events: body.events,
      secret: body.secret,
      rps_override,
    });
    return writeJson(res, 201, { success: true, subscription: row });
  } catch (error) {
    return writeJson(res, 400, { success: false, error: error.message });
  }
}

module.exports = async function handler(req, res) {
  return handleSubscribe(req, res);
};
module.exports.handleSubscribe = handleSubscribe;
// Expose for tests + dependents that want to validate at the same layer.
module.exports.resolvePerSubRps = resolvePerSubRps;
module.exports.PLAN_TIER_RPS = PLAN_TIER_RPS;
