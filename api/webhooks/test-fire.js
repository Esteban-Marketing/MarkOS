'use strict';

const { writeJson } = require('../../lib/markos/crm/api.cjs');
const { initOtel, withSpan, recordEvent } = require('../../lib/markos/observability/otel.cjs');
const { enqueueDelivery, processDelivery } = require('../../lib/markos/webhooks/delivery.cjs');
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

async function handleTestFire(req, res, span) {
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

  const subscription_id = body.subscription_id;
  const event = body.event || 'approval.created';
  if (!subscription_id) return writeJsonWithSpan(span, res, 400, { success: false, error: 'SUBSCRIPTION_ID_REQUIRED' });
  span?.setAttribute('webhook_subscription_id', subscription_id);

  const { subscriptions, deliveries, queue } = getWebhookStores();
  const subscription = await subscriptions.findById(tenantId, subscription_id);
  if (!subscription) return writeJsonWithSpan(span, res, 404, { success: false, error: 'SUBSCRIPTION_NOT_FOUND' });

  const delivery = await enqueueDelivery(deliveries, queue, {
    subscription,
    event,
    payload: body.payload || { test: true, sent_at: new Date().toISOString() },
  });

  if (body.skip_dispatch === true) {
    recordEvent('webhook.test_fired', {
      tenant_id: tenantId,
      webhook_subscription_id: subscription_id,
      delivery_id: delivery.id,
      event_type: event,
    });
    return writeJsonWithSpan(span, res, 202, { success: true, delivery });
  }

  const result = await processDelivery(deliveries, subscriptions, delivery.id);
  recordEvent('webhook.test_fired', {
    tenant_id: tenantId,
    webhook_subscription_id: subscription_id,
    delivery_id: delivery.id,
    event_type: event,
  });
  return writeJsonWithSpan(span, res, 200, { success: true, delivery_id: delivery.id, result });
}

module.exports = async function handler(req, res) {
  return withSpan('webhook.test_fire', { method: req.method }, async (span) => handleTestFire(req, res, span));
};
module.exports.handleTestFire = handleTestFire;
