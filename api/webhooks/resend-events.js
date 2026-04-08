'use strict';

const { writeJson, getCrmStore } = require('../../lib/markos/crm/api.cjs');
const { normalizeOutboundEventForLedger } = require('../../lib/markos/outbound/events.ts');
const { appendConversationProviderEvent } = require('../../lib/markos/outbound/conversations.ts');

async function handleResendWebhook(req, res) {
  if (req.method !== 'POST') {
    return writeJson(res, 405, { success: false, error: 'METHOD_NOT_ALLOWED' });
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
    return writeJson(res, 200, { success: true, provider_event: normalized });
  } catch (error) {
    return writeJson(res, 400, { success: false, error: error.message });
  }
}

module.exports = async function handler(req, res) {
  return handleResendWebhook(req, res);
};

module.exports.handleResendWebhook = handleResendWebhook;