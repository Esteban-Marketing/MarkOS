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

function createTwilioAdapter(options = {}) {
  const fetchImpl = options.fetchImpl || (typeof fetch === 'function' ? fetch.bind(globalThis) : null);
  const accountSid = options.accountSid || process.env.TWILIO_ACCOUNT_SID || '';
  const authToken = options.authToken || process.env.TWILIO_AUTH_TOKEN || '';
  const defaultFromSms = options.defaultFromSms || process.env.MARKOS_OUTBOUND_SMS_FROM || '+10000000000';
  const defaultFromWhatsApp = options.defaultFromWhatsApp || process.env.MARKOS_OUTBOUND_WHATSAPP_FROM || 'whatsapp:+10000000001';

  return {
    provider: 'twilio',
    channels: ['sms', 'whatsapp'],
    async send(message = {}) {
      const channel = String(message.channel || '').trim().toLowerCase();
      if (!['sms', 'whatsapp'].includes(channel)) {
        throw new Error(`CRM_OUTBOUND_CHANNEL_INVALID:${message.channel}`);
      }

      const requestBody = new URLSearchParams({
        To: formatTwilioRecipient(channel, message.to),
        From: channel === 'whatsapp' ? defaultFromWhatsApp : defaultFromSms,
        Body: String(message.body_markdown || message.body_text || '').trim(),
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
          const error = new Error(responseJson?.message || 'CRM_OUTBOUND_PROVIDER_ERROR');
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
    normalizeEvent(payload = {}) {
      const status = normalizeTwilioStatus(payload.MessageStatus || payload.SmsStatus || payload.status);
      const from = String(payload.From || payload.from || '').trim();
      const to = String(payload.To || payload.to || '').trim();
      const channel = from.startsWith('whatsapp:') || to.startsWith('whatsapp:') ? 'whatsapp' : 'sms';
      return {
        provider: 'twilio',
        channel,
        direction: status === 'received' ? 'inbound' : 'outbound',
        provider_message_id: String(payload.SmsSid || payload.MessageSid || payload.sid || '').trim(),
        status,
        recipient: to,
        sender: from,
        body: payload.Body ? String(payload.Body) : '',
      };
    },
  };
}

module.exports = {
  createTwilioAdapter,
};