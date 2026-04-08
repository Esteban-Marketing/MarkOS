'use strict';

const { createResendAdapter } = require('./providers/resend-adapter.ts');
const { createTwilioAdapter } = require('./providers/twilio-adapter.ts');
const { normalizeOutboundProviderEvent } = require('./providers/base-adapter.ts');

function normalizeOutboundEventForLedger(input = {}) {
  const provider = String(input.provider || '').trim().toLowerCase();
  const adapter = provider === 'resend' ? createResendAdapter() : createTwilioAdapter();
  const normalized = normalizeOutboundProviderEvent(adapter, input.payload || {});
  const text = normalized.body || (input.payload && input.payload.Body ? String(input.payload.Body) : '');
  const optOut = /^(stop|unsubscribe|cancel|end|quit)$/i.test(String(text || '').trim());

  return {
    provider: normalized.provider,
    channel: normalized.channel,
    direction: normalized.direction,
    provider_message_id: normalized.provider_message_id,
    status: optOut ? 'opted_out' : normalized.status,
    recipient: normalized.recipient || null,
    sender: normalized.sender || null,
    body: text,
    opt_out: optOut,
  };
}

function buildConversationStateUpdate(current = {}, event = {}) {
  const currentStatus = String(current.status || 'active').trim();
  const direction = String(event.direction || '').trim();
  const status = String(event.status || '').trim();

  if (status === 'opted_out') {
    return {
      status: 'opted_out',
      unresolved: false,
      last_direction: direction || current.last_direction || null,
      last_message_at: event.occurred_at || current.last_message_at || null,
    };
  }
  if (direction === 'inbound' && status === 'received') {
    return {
      status: 'reply_pending',
      unresolved: true,
      last_direction: 'inbound',
      last_message_at: event.occurred_at || current.last_message_at || null,
    };
  }
  if (status === 'failed') {
    return {
      status: 'delivery_failed',
      unresolved: true,
      last_direction: direction || current.last_direction || 'outbound',
      last_message_at: event.occurred_at || current.last_message_at || null,
    };
  }
  return {
    status: status === 'delivered' ? 'active' : currentStatus,
    unresolved: current.unresolved === true ? true : false,
    last_direction: direction || current.last_direction || 'outbound',
    last_message_at: event.occurred_at || current.last_message_at || null,
  };
}

module.exports = {
  normalizeOutboundEventForLedger,
  buildConversationStateUpdate,
};