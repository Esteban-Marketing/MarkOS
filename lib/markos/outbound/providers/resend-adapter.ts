import type { Stats } from 'node:fs';

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

function toTrimmedString(value, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

function createResendAdapter(options: Record<string, unknown> = {}) {
  const fetchImpl = options.fetchImpl || (typeof fetch === 'function' ? fetch.bind(globalThis) : null);
  const apiKey = toTrimmedString(options.apiKey, process.env.RESEND_API_KEY || '');
  const defaultFrom = toTrimmedString(options.defaultFrom, process.env.MARKOS_OUTBOUND_EMAIL_FROM || 'no-reply@markos.local');

  return {
    provider: 'resend',
    channels: ['email'],
    async send(message: Record<string, unknown> = {}) {
      if (toTrimmedString(message.channel).toLowerCase() !== 'email') {
        throw new Error('CRM_OUTBOUND_CHANNEL_INVALID:email');
      }

      const brandContext = message.brand || {
        tenantId: toTrimmedString(message.tenant_id),
        label: 'MarkOS',
        logoUrl: null,
        primaryColor: '#0d9488',
        primaryTextColor: '#ffffff',
      };
      const notification = buildPluginNotificationPayload({
        type: 'email',
        subject: toTrimmedString(message.subject),
        body: toTrimmedString(message.body_markdown, toTrimmedString(message.body_text)),
        recipientId: toTrimmedString(message.contact_id, toTrimmedString(message.to)),
      }, brandContext);

      const requestBody = {
        from: toTrimmedString(message.from, defaultFrom),
        to: [toTrimmedString(message.to)],
        subject: notification.subject,
        text: notification.body,
        tags: [
          { name: 'tenant_id', value: toTrimmedString(message.tenant_id) },
          { name: 'contact_id', value: toTrimmedString(message.contact_id) },
          { name: 'brand_label', value: toTrimmedString(notification.brand.label, 'MarkOS') },
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
          const error = new Error(responseJson?.message || 'CRM_OUTBOUND_PROVIDER_ERROR') as Error & { code?: string };
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
    normalizeEvent(payload: Record<string, unknown> = {}) {
      const eventType = toTrimmedString(payload.type, toTrimmedString(payload.event)).toLowerCase();
      const data: Record<string, unknown> =
        payload.data && typeof payload.data === 'object'
          ? payload.data as Record<string, unknown>
          : {};

      return {
        provider: 'resend',
        channel: 'email',
        direction: eventType.includes('reply') ? 'inbound' : 'outbound',
        provider_message_id: toTrimmedString(data.email_id, toTrimmedString(data.id)),
        status: normalizeEmailStatus(eventType.split('.').pop()),
        recipient: Array.isArray(data.to) ? toTrimmedString(data.to[0]) : toTrimmedString(data.to),
      };
    },
  };
}

module.exports = {
  createResendAdapter,
};