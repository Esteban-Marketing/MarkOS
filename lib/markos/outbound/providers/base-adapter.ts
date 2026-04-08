export type __ModuleMarker = import('node:fs').Stats;

'use strict';

const CHANNEL_CAPABILITIES = Object.freeze({
  email: Object.freeze({
    channel: 'email',
    provider: 'resend',
    supports_subject: true,
    supports_templates: true,
    supports_replies: true,
  }),
  sms: Object.freeze({
    channel: 'sms',
    provider: 'twilio',
    supports_subject: false,
    supports_templates: false,
    supports_replies: true,
  }),
  whatsapp: Object.freeze({
    channel: 'whatsapp',
    provider: 'twilio',
    supports_subject: false,
    supports_templates: true,
    supports_replies: true,
  }),
});

function getOutboundChannelCapabilities(channel) {
  const normalized = String(channel || '').trim().toLowerCase();
  const capabilities = CHANNEL_CAPABILITIES[normalized];
  if (!capabilities) {
    throw new Error(`CRM_OUTBOUND_CHANNEL_INVALID:${channel}`);
  }
  return capabilities;
}

async function sendOutboundMessage(adapter, message) {
  if (!adapter || typeof adapter.send !== 'function') {
    throw new TypeError('CRM_OUTBOUND_ADAPTER_INVALID');
  }
  return adapter.send(message || {});
}

function normalizeOutboundProviderEvent(adapter, payload) {
  if (!adapter || typeof adapter.normalizeEvent !== 'function') {
    throw new TypeError('CRM_OUTBOUND_ADAPTER_INVALID');
  }
  return adapter.normalizeEvent(payload || {});
}

module.exports = {
  getOutboundChannelCapabilities,
  sendOutboundMessage,
  normalizeOutboundProviderEvent,
};