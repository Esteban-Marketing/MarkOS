'use strict';

const { writeJson, getCrmStore } = require('../../lib/markos/crm/api.cjs');
const { initOtel, withSpan } = require('../../lib/markos/observability/otel.cjs');
const { normalizeOutboundEventForLedger } = require('../../lib/markos/outbound/events.ts');
const { appendConversationProviderEvent } = require('../../lib/markos/outbound/conversations.ts');

initOtel({ serviceName: 'markos' });

function writeJsonWithSpan(span, res, statusCode, payload) {
  span?.setAttribute('status_code', statusCode);
  return writeJson(res, statusCode, payload);
}

async function handleResendWebhook(req, res, span) {
  if (req.method !== 'POST') {
    return writeJsonWithSpan(span, res, 405, { success: false, error: 'METHOD_NOT_ALLOWED' });
  }

  const store = getCrmStore(req);
  try {
    const normalized = normalizeOutboundEventForLedger({ provider: 'resend', payload: req.body || {} });
    appendConversationProviderEvent(store, {
      provider: normalized.provider,
      provider_message_id: normalized.provider_message_id,
      channel: normalized.channel,
      direction: normalized.direction,
      status: normalized.status,
      text: normalized.body,
    });
    return writeJsonWithSpan(span, res, 200, { success: true, provider_event: normalized });
  } catch (error) {
    return writeJsonWithSpan(span, res, 400, { success: false, error: error.message });
  }
}

module.exports = async function handler(req, res) {
  return withSpan('webhook.resend_events', { method: req.method }, async (span) => handleResendWebhook(req, res, span));
};

module.exports.handleResendWebhook = handleResendWebhook;
