'use strict';

const { writeJson } = require('../../lib/markos/crm/api.cjs');
const { enqueueDelivery, processDelivery } = require('../../lib/markos/webhooks/delivery.cjs');
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

async function handleTestFire(req, res) {
  if (req.method !== 'POST') return writeJson(res, 405, { success: false, error: 'METHOD_NOT_ALLOWED' });
  const tenantId = resolveTenantId(req);
  if (!tenantId) return writeJson(res, 401, { success: false, error: 'TENANT_CONTEXT_REQUIRED' });

  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    return writeJson(res, 400, { success: false, error: 'INVALID_JSON' });
  }

  const subscription_id = body.subscription_id;
  const event = body.event || 'approval.created';
  if (!subscription_id) return writeJson(res, 400, { success: false, error: 'SUBSCRIPTION_ID_REQUIRED' });

  const { subscriptions, deliveries, queue } = getWebhookStores();
  const subscription = await subscriptions.findById(tenantId, subscription_id);
  if (!subscription) return writeJson(res, 404, { success: false, error: 'SUBSCRIPTION_NOT_FOUND' });

  const delivery = await enqueueDelivery(deliveries, queue, {
    subscription,
    event,
    payload: body.payload || { test: true, sent_at: new Date().toISOString() },
  });

  if (body.skip_dispatch === true) {
    return writeJson(res, 202, { success: true, delivery });
  }

  const result = await processDelivery(deliveries, subscriptions, delivery.id);
  return writeJson(res, 200, { success: true, delivery_id: delivery.id, result });
}

module.exports = async function handler(req, res) {
  return handleTestFire(req, res);
};
module.exports.handleTestFire = handleTestFire;
