'use strict';

const { writeJson } = require('../../lib/markos/crm/api.cjs');
const { initOtel, withSpan } = require('../../lib/markos/observability/otel.cjs');
const { listSubscriptions, sanitizeSubscriptionRow } = require('../../lib/markos/webhooks/engine.cjs');
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

async function handleList(req, res, span) {
  if (req.method !== 'GET') return writeJsonWithSpan(span, res, 405, { success: false, error: 'METHOD_NOT_ALLOWED' });
  const tenantId = resolveTenantId(req);
  if (!tenantId) return writeJsonWithSpan(span, res, 401, { success: false, error: 'TENANT_CONTEXT_REQUIRED' });
  span?.setAttribute('tenant_id', tenantId);

  const { subscriptions } = getWebhookStores();
  const rows = await listSubscriptions(subscriptions, tenantId);
  return writeJsonWithSpan(span, res, 200, { success: true, subscriptions: rows.map(sanitizeSubscriptionRow) });
}

module.exports = async function handler(req, res) {
  return withSpan('webhook.list', { method: req.method }, async (span) => handleList(req, res, span));
};
module.exports.handleList = handleList;
