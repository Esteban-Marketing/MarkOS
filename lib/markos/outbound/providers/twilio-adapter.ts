import type { Stats } from 'node:fs';

'use strict';

function normalizeTwilioStatus(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) {
    return 'queued';
  }
  if (['queued', 'accepted', 'sending'].includes(normalized)) {
    return 'queued';
  }
  if (['sent', 'delivered'].includes(normalized)) {
    return normalized;
  }
  if (['undelivered', 'failed'].includes(normalized)) {
    return 'failed';
  }
  if (['received', 'inbound'].includes(normalized)) {
    return 'received';
  }
  return normalized;
}

function formatTwilioRecipient(channel, value) {
  const normalized = String(value || '').trim();
  if (channel === 'whatsapp') {
    return normalized.startsWith('whatsapp:') ? normalized : `whatsapp:${normalized}`;
  }
  return normalized;
}

function toTrimmedString(value, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

function createTwilioAdapter(options: Record<string, unknown> = {}) {
  const fetchImpl = options.fetchImpl || (typeof fetch === 'function' ? fetch.bind(globalThis) : null);
  const accountSid = toTrimmedString(options.accountSid, process.env.TWILIO_ACCOUNT_SID || '');
  const authToken = toTrimmedString(options.authToken, process.env.TWILIO_AUTH_TOKEN || '');
  const defaultFromSms = toTrimmedString(options.defaultFromSms, process.env.MARKOS_OUTBOUND_SMS_FROM || '+10000000000');
  const defaultFromWhatsApp = toTrimmedString(options.defaultFromWhatsApp, process.env.MARKOS_OUTBOUND_WHATSAPP_FROM || 'whatsapp:+10000000001');

  return {
    provider: 'twilio',
    channels: ['sms', 'whatsapp'],
    async send(message: Record<string, unknown> = {}) {
      const channel = toTrimmedString(message.channel).toLowerCase();
      if (!['sms', 'whatsapp'].includes(channel)) {
        throw new Error(`CRM_OUTBOUND_CHANNEL_INVALID:${message.channel}`);
      }

      const requestBody = new URLSearchParams({
        To: formatTwilioRecipient(channel, message.to),
        From: channel === 'whatsapp' ? defaultFromWhatsApp : defaultFromSms,
        Body: toTrimmedString(message.body_markdown, toTrimmedString(message.body_text)),
      });

      let responseJson;
      if (fetchImpl && accountSid && authToken) {
        const response = await fetchImpl(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
          method: 'POST',
          headers: {
            Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: requestBody.toString(),
        });
        responseJson = await response.json();
        if (!response.ok) {
          const error = new Error(responseJson?.message || 'CRM_OUTBOUND_PROVIDER_ERROR') as Error & { code?: string };
          error.code = 'CRM_OUTBOUND_PROVIDER_ERROR';
          throw error;
        }
      } else {
        responseJson = { sid: `SM_sandbox_${Date.now()}`, status: 'queued' };
      }

      return {
        provider: 'twilio',
        channel,
        provider_message_id: String(responseJson.sid || responseJson.message_sid || '').trim(),
        status: normalizeTwilioStatus(responseJson.status),
        recipient: formatTwilioRecipient(channel, message.to),
      };
    },
    normalizeEvent(payload: Record<string, unknown> = {}) {
      const status = normalizeTwilioStatus(payload.MessageStatus || payload.SmsStatus || payload.status);
      const from = toTrimmedString(payload.From, toTrimmedString(payload.from));
      const to = toTrimmedString(payload.To, toTrimmedString(payload.to));
      const channel = from.startsWith('whatsapp:') || to.startsWith('whatsapp:') ? 'whatsapp' : 'sms';
      return {
        provider: 'twilio',
        channel,
        direction: status === 'received' ? 'inbound' : 'outbound',
        provider_message_id: toTrimmedString(payload.SmsSid, toTrimmedString(payload.MessageSid, toTrimmedString(payload.sid))),
        status,
        recipient: to,
        sender: from,
        body: typeof payload.Body === 'string' ? payload.Body : '',
      };
    },
  };
}

module.exports = {
  createTwilioAdapter,
};