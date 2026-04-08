'use strict';

const { writeJson, getCrmStore } = require('../../lib/markos/crm/api.cjs');
const { normalizeOutboundEventForLedger } = require('../../lib/markos/outbound/events.ts');
const { appendConversationProviderEvent, applyOptOutFromConversation } = require('../../lib/markos/outbound/conversations.ts');

async function handleTwilioWebhook(req, res) {
  if (req.method !== 'POST') {
    return writeJson(res, 405, { success: false, error: 'METHOD_NOT_ALLOWED' });
  }

  const store = getCrmStore(req);
  try {
    const normalized = normalizeOutboundEventForLedger({ provider: 'twilio', payload: req.body || {} });
    appendConversationProviderEvent(store, {
      provider: normalized.provider,
      provider_message_id: normalized.provider_message_id,
      channel: normalized.channel,
      direction: normalized.direction,
      status: normalized.status,
      text: normalized.body,
    });
    if (normalized.opt_out) {
      applyOptOutFromConversation(store, {
        provider_message_id: normalized.provider_message_id,
        channel: normalized.channel,
        reason: 'provider_opt_out',
      });
    }
    return writeJson(res, 200, { success: true, provider_event: normalized });
  } catch (error) {
    return writeJson(res, 400, { success: false, error: error.message });
  }
}

module.exports = async function handler(req, res) {
  return handleTwilioWebhook(req, res);
};

module.exports.handleTwilioWebhook = handleTwilioWebhook;