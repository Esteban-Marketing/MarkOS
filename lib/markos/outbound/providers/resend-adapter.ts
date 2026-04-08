export type __ModuleMarker = import('node:fs').Stats;

'use strict';

const { buildPluginNotificationPayload } = require('../../plugins/brand-context.js');

function normalizeEmailStatus(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) {
    return 'queued';
  }
  if (['queued', 'sent', 'scheduled', 'processing'].includes(normalized)) {
    return normalized === 'processing' ? 'queued' : normalized;
  }
  if (['delivered', 'delivery_delayed'].includes(normalized)) {
    return 'delivered';
  }
  if (['bounced', 'complained', 'failed'].includes(normalized)) {
    return normalized === 'complained' ? 'failed' : normalized;
  }
  if (['opened', 'clicked'].includes(normalized)) {
    return normalized;
  }
  return 'queued';
}

function createResendAdapter(options = {}) {
  const fetchImpl = options.fetchImpl || (typeof fetch === 'function' ? fetch.bind(globalThis) : null);
  const apiKey = options.apiKey || process.env.RESEND_API_KEY || '';
  const defaultFrom = options.defaultFrom || process.env.MARKOS_OUTBOUND_EMAIL_FROM || 'no-reply@markos.local';

  return {
    provider: 'resend',
    channels: ['email'],
    async send(message = {}) {
      if (String(message.channel || '').trim().toLowerCase() !== 'email') {
        throw new Error('CRM_OUTBOUND_CHANNEL_INVALID:email');
      }

      const brandContext = message.brand || {
        tenantId: String(message.tenant_id || '').trim(),
        label: 'MarkOS',
        logoUrl: null,
        primaryColor: '#0d9488',
        primaryTextColor: '#ffffff',
      };
      const notification = buildPluginNotificationPayload({
        type: 'email',
        subject: String(message.subject || '').trim(),
        body: String(message.body_markdown || message.body_text || '').trim(),
        recipientId: String(message.contact_id || message.to || '').trim(),
      }, brandContext);

      const requestBody = {
        from: String(message.from || defaultFrom).trim(),
        to: [String(message.to || '').trim()],
        subject: notification.subject,
        text: notification.body,
        tags: [
          { name: 'tenant_id', value: String(message.tenant_id || '').trim() },
          { name: 'contact_id', value: String(message.contact_id || '').trim() },
          { name: 'brand_label', value: String(notification.brand.label || 'MarkOS').trim() },
        ],
      };

      let responseJson;
      if (fetchImpl && apiKey) {
        const response = await fetchImpl('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });
        responseJson = await response.json();
        if (!response.ok) {
          const error = new Error(responseJson?.message || 'CRM_OUTBOUND_PROVIDER_ERROR');
          error.code = 'CRM_OUTBOUND_PROVIDER_ERROR';
          throw error;
        }
      } else {
        responseJson = { id: `re_sandbox_${Date.now()}` };
      }

      return {
        provider: 'resend',
        channel: 'email',
        provider_message_id: String(responseJson.id || responseJson.message_id || '').trim(),
        status: normalizeEmailStatus(responseJson.status),
        recipient: requestBody.to[0],
        subject: requestBody.subject,
        brand_label: notification.brand.label,
      };
    },
    normalizeEvent(payload = {}) {
      const eventType = String(payload.type || payload.event || '').trim().toLowerCase();
      const data = payload.data && typeof payload.data === 'object' ? payload.data : {};

      return {
        provider: 'resend',
        channel: 'email',
        direction: eventType.includes('reply') ? 'inbound' : 'outbound',
        provider_message_id: String(data.email_id || data.id || '').trim(),
        status: normalizeEmailStatus(eventType.split('.').pop()),
        recipient: Array.isArray(data.to) ? String(data.to[0] || '').trim() : String(data.to || '').trim(),
      };
    },
  };
}

module.exports = {
  createResendAdapter,
};