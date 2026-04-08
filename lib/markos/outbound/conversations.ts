'use strict';

const { getCrmStore, appendCrmActivity } = require('../crm/api.cjs');
const { recordOutboundOptOut } = require('./consent.ts');
const { buildConversationStateUpdate } = require('./events.ts');

function buildThreadId(message, channelOverride = null) {
  return `thread-${message.tenant_id}-${message.record_kind}-${message.record_id}-${channelOverride || message.channel}`;
}

function buildOutboundMessageEntry(message) {
  return Object.freeze({
    message_id: `message-${message.outbound_id}`,
    provider_message_id: message.provider_message_id || null,
    direction: 'outbound',
    status: message.status || 'sent',
    channel: message.channel,
    text: message.body_markdown || '',
    occurred_at: message.created_at,
    provider: message.provider || null,
  });
}

function ensureConversationStore(store) {
  const targetStore = getCrmStore({ crmStore: store });
  if (!Array.isArray(targetStore.outboundConversations)) {
    targetStore.outboundConversations = [];
  }
  return targetStore;
}

function findMessageByProviderRef(store, providerMessageId) {
  return store.outboundMessages.find((row) => row.provider_message_id === providerMessageId) || null;
}

function ensureThread(store, message, channelOverride = null) {
  const threadId = buildThreadId(message, channelOverride);
  let thread = store.outboundConversations.find((row) => row.thread_id === threadId) || null;
  if (thread) {
    return thread;
  }

  thread = {
    thread_id: threadId,
    tenant_id: message.tenant_id,
    contact_id: message.contact_id,
    record_kind: message.record_kind,
    record_id: message.record_id,
    channel: channelOverride || message.channel,
    provider: message.provider || null,
    status: 'active',
    unresolved: false,
    last_direction: 'outbound',
    last_message_at: message.created_at,
    messages: [buildOutboundMessageEntry(message)],
  };
  store.outboundConversations.push(thread);
  return thread;
}

function appendConversationProviderEvent(store, input = {}) {
  const targetStore = ensureConversationStore(store);
  const providerMessageId = String(input.provider_message_id || '').trim();
  const message = findMessageByProviderRef(targetStore, providerMessageId);
  if (!message) {
    throw new Error('CRM_OUTBOUND_PROVIDER_REF_UNKNOWN');
  }

  const thread = ensureThread(targetStore, message, input.channel || message.channel);
  const event = Object.freeze({
    message_id: `message-${thread.thread_id}-${thread.messages.length + 1}`,
    provider_message_id: providerMessageId,
    direction: String(input.direction || 'inbound').trim(),
    status: String(input.status || 'received').trim(),
    channel: String(input.channel || message.channel).trim(),
    text: String(input.text || '').trim(),
    occurred_at: new Date(input.occurred_at || Date.now()).toISOString(),
    provider: String(input.provider || message.provider || '').trim() || null,
  });
  thread.messages.push(event);

  const stateUpdate = buildConversationStateUpdate(thread, event);
  thread.status = stateUpdate.status;
  thread.unresolved = stateUpdate.unresolved;
  thread.last_direction = stateUpdate.last_direction;
  thread.last_message_at = stateUpdate.last_message_at;

  appendCrmActivity(targetStore, {
    tenant_id: message.tenant_id,
    activity_family: 'outbound_event',
    related_record_kind: message.record_kind,
    related_record_id: message.record_id,
    source_event_ref: `provider:${event.provider}:${providerMessageId}`,
    actor_id: null,
    occurred_at: event.occurred_at,
    payload_json: {
      action: 'conversation_event_recorded',
      direction: event.direction,
      status: event.status,
      channel: event.channel,
      provider: event.provider,
      provider_message_id: providerMessageId,
      text: event.text,
    },
  });

  return {
    thread_id: thread.thread_id,
    event,
    thread,
  };
}

function appendInboundConversationEvent(store, input = {}) {
  return appendConversationProviderEvent(store, input);
}

function buildOutboundConversation(store, selector = {}) {
  const targetStore = ensureConversationStore(store);
  const tenantId = String(selector.tenant_id || '').trim();
  const recordKind = String(selector.record_kind || '').trim();
  const recordId = String(selector.record_id || '').trim();
  const matchingMessages = targetStore.outboundMessages.filter((row) => row.tenant_id === tenantId && row.record_kind === recordKind && row.record_id === recordId);
  const preferred = targetStore.outboundConversations.find((row) => row.tenant_id === tenantId && row.record_kind === recordKind && row.record_id === recordId)
    || (matchingMessages[0] ? ensureThread(targetStore, matchingMessages[0]) : null);

  if (!preferred) {
    return null;
  }

  const messageMap = new Map();
  preferred.messages.forEach((item) => {
    messageMap.set(item.message_id, item);
  });

  matchingMessages.forEach((message) => {
    const outboundEntry = buildOutboundMessageEntry(message);
    if (!messageMap.has(outboundEntry.message_id)) {
      messageMap.set(outboundEntry.message_id, outboundEntry);
    }
  });

  const messages = Array.from(messageMap.values()).sort((left, right) => Date.parse(left.occurred_at) - Date.parse(right.occurred_at));
  return {
    ...preferred,
    messages,
  };
}

function listOutboundConversations(store, selector = {}) {
  const targetStore = ensureConversationStore(store);
  const tenantId = String(selector.tenant_id || '').trim();
  return targetStore.outboundConversations
    .filter((row) => row.tenant_id === tenantId)
    .map((row) => buildOutboundConversation(targetStore, {
      tenant_id: row.tenant_id,
      record_kind: row.record_kind,
      record_id: row.record_id,
    }))
    .filter(Boolean)
    .sort((left, right) => Date.parse(right.last_message_at || 0) - Date.parse(left.last_message_at || 0));
}

function applyOptOutFromConversation(store, input = {}) {
  const targetStore = ensureConversationStore(store);
  const providerMessageId = String(input.provider_message_id || '').trim();
  const message = findMessageByProviderRef(targetStore, providerMessageId);
  if (!message) {
    return null;
  }
  return recordOutboundOptOut(targetStore, {
    tenant_id: message.tenant_id,
    contact_id: message.contact_id,
    channel: input.channel || message.channel,
    actor_id: input.actor_id || null,
    reason: input.reason || 'provider_opt_out',
  });
}

module.exports = {
  buildOutboundConversation,
  appendInboundConversationEvent,
  appendConversationProviderEvent,
  listOutboundConversations,
  applyOptOutFromConversation,
};