'use strict';

const { writeJson } = require('../../lib/markos/crm/api.cjs');
const { subscribe } = require('../../lib/markos/webhooks/engine.cjs');
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

  const { subscriptions } = getWebhookStores();
  try {
    const row = await subscribe(subscriptions, {
      tenant_id: tenantId,
      url: body.url,
      events: body.events,
      secret: body.secret,
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
