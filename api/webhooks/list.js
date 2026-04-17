'use strict';

const { writeJson } = require('../../lib/markos/crm/api.cjs');
const { listSubscriptions } = require('../../lib/markos/webhooks/engine.cjs');
const { getWebhookStores } = require('../../lib/markos/webhooks/store.cjs');

function resolveTenantId(req) {
  const auth = (req && (req.markosAuth || req.tenantContext)) || {};
  return auth.tenant_id || auth.principal?.tenant_id || auth.tenantId;
}

async function handleList(req, res) {
  if (req.method !== 'GET') return writeJson(res, 405, { success: false, error: 'METHOD_NOT_ALLOWED' });
  const tenantId = resolveTenantId(req);
  if (!tenantId) return writeJson(res, 401, { success: false, error: 'TENANT_CONTEXT_REQUIRED' });

  const { subscriptions } = getWebhookStores();
  const rows = await listSubscriptions(subscriptions, tenantId);
  return writeJson(res, 200, { success: true, subscriptions: rows });
}

module.exports = async function handler(req, res) {
  return handleList(req, res);
};
module.exports.handleList = handleList;
