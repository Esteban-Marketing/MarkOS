'use strict';

const { writeJson } = require('../../lib/markos/crm/api.cjs');
const { initOtel, withSpan } = require('../../lib/markos/observability/otel.cjs');
const { sanitizeSubscriptionRow, unsubscribe } = require('../../lib/markos/webhooks/engine.cjs');
const { getWebhookStores } = require('../../lib/markos/webhooks/store.cjs');

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

async function handleUnsubscribe(req, res, span) {
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    return writeJsonWithSpan(span, res, 405, { success: false, error: 'METHOD_NOT_ALLOWED' });
  }
  const tenantId = resolveTenantId(req);
  if (!tenantId) return writeJsonWithSpan(span, res, 401, { success: false, error: 'TENANT_CONTEXT_REQUIRED' });
  span?.setAttribute('tenant_id', tenantId);

  let id;
  try {
    const body = req.method === 'DELETE' ? {} : await readJsonBody(req);
    id = body.id || (req.query && req.query.id);
  } catch {
    return writeJsonWithSpan(span, res, 400, { success: false, error: 'INVALID_JSON' });
  }
  if (!id) return writeJsonWithSpan(span, res, 400, { success: false, error: 'ID_REQUIRED' });
  span?.setAttribute('webhook_subscription_id', id);

  const { subscriptions } = getWebhookStores();
  try {
    const row = await unsubscribe(subscriptions, tenantId, id);
    return writeJsonWithSpan(span, res, 200, { success: true, subscription: sanitizeSubscriptionRow(row) });
  } catch (error) {
    const status = /not found/i.test(error.message) ? 404 : 400;
    return writeJsonWithSpan(span, res, status, { success: false, error: error.message });
  }
}

module.exports = async function handler(req, res) {
  return withSpan('webhook.unsubscribe', { method: req.method }, async (span) => handleUnsubscribe(req, res, span));
};
module.exports.handleUnsubscribe = handleUnsubscribe;
