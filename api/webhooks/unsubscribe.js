'use strict';

const { writeJson } = require('../../lib/markos/crm/api.cjs');
const { unsubscribe } = require('../../lib/markos/webhooks/engine.cjs');
const { getWebhookStores } = require('../../lib/markos/webhooks/store.cjs');

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

async function handleUnsubscribe(req, res) {
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    return writeJson(res, 405, { success: false, error: 'METHOD_NOT_ALLOWED' });
  }
  const tenantId = resolveTenantId(req);
  if (!tenantId) return writeJson(res, 401, { success: false, error: 'TENANT_CONTEXT_REQUIRED' });

  let id;
  try {
    const body = req.method === 'DELETE' ? {} : await readJsonBody(req);
    id = body.id || (req.query && req.query.id);
  } catch {
    return writeJson(res, 400, { success: false, error: 'INVALID_JSON' });
  }
  if (!id) return writeJson(res, 400, { success: false, error: 'ID_REQUIRED' });

  const { subscriptions } = getWebhookStores();
  try {
    const row = await unsubscribe(subscriptions, tenantId, id);
    return writeJson(res, 200, { success: true, subscription: row });
  } catch (error) {
    const status = /not found/i.test(error.message) ? 404 : 400;
    return writeJson(res, status, { success: false, error: error.message });
  }
}

module.exports = async function handler(req, res) {
  return handleUnsubscribe(req, res);
};
module.exports.handleUnsubscribe = handleUnsubscribe;
