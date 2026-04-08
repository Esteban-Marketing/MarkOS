'use strict';

const { createRuntimeContext, requireHostedSupabaseAuth } = require('../../../onboarding/backend/runtime-context.cjs');
const {
  writeJson,
  requireCrmTenantContext,
  assertCrmMutationAllowed,
  getCrmStore,
  appendCrmActivity,
  listCrmEntities,
} = require('../../../lib/markos/crm/api.cjs');
const { getPluginBrandContext } = require('../../../lib/markos/plugins/brand-context.js');
const { sendOutboundMessage } = require('../../../lib/markos/outbound/providers/base-adapter.ts');
const { createResendAdapter } = require('../../../lib/markos/outbound/providers/resend-adapter.ts');
const { createTwilioAdapter } = require('../../../lib/markos/outbound/providers/twilio-adapter.ts');
const { evaluateOutboundEligibility } = require('../../../lib/markos/outbound/consent.ts');

function normalizeChannel(channel) {
  const normalized = String(channel || '').trim().toLowerCase();
  if (!['email', 'sms', 'whatsapp'].includes(normalized)) {
    throw new Error(`CRM_OUTBOUND_CHANNEL_INVALID:${channel}`);
  }
  return normalized;
}

function createDefaultProviderRegistry() {
  return {
    email: createResendAdapter(),
    sms: createTwilioAdapter(),
    whatsapp: createTwilioAdapter(),
  };
}

function findTenantContact(store, tenantId, contactId) {
  return listCrmEntities(store, { tenant_id: tenantId, record_kind: 'contact' }).find((record) => record.entity_id === contactId) || null;
}

function createOutboundRecord(store, context, body, eligibility, providerResult, outcome) {
  const nextIndex = store.outboundMessages.length + 1;
  const now = new Date().toISOString();
  const outboundRecord = Object.freeze({
    outbound_id: `outbound-${context.tenant_id}-${String(nextIndex).padStart(4, '0')}`,
    tenant_id: context.tenant_id,
    contact_id: String(body.contact_id || '').trim(),
    record_kind: String(body.record_kind || 'contact').trim(),
    record_id: String(body.record_id || body.contact_id || '').trim(),
    channel: normalizeChannel(body.channel),
    provider: providerResult?.provider || null,
    provider_message_id: providerResult?.provider_message_id || null,
    status: providerResult?.status || 'blocked',
    outcome,
    subject: body.subject ? String(body.subject).trim() : null,
    body_markdown: String(body.body_markdown || '').trim(),
    use_case: String(body.use_case || 'marketing').trim(),
    risk_level: String(body.risk_level || 'standard').trim(),
    contact_point: eligibility.contact_point || null,
    created_by: context.actor_id,
    created_at: now,
    updated_at: now,
  });
  store.outboundMessages.push(outboundRecord);
  return outboundRecord;
}

function appendOutboundActivity(store, context, body, record, details) {
  return appendCrmActivity(store, {
    tenant_id: context.tenant_id,
    activity_family: 'outbound_event',
    related_record_kind: record.record_kind,
    related_record_id: record.record_id,
    source_event_ref: `api:crm:outbound:send:${record.channel}:${record.outbound_id}`,
    actor_id: context.actor_id,
    payload_json: {
      action: details.action,
      outcome: details.outcome,
      outbound_id: record.outbound_id,
      channel: record.channel,
      contact_id: record.contact_id,
      provider: record.provider,
      provider_message_id: record.provider_message_id,
      status: record.status,
      reason_code: details.reason_code || null,
      template_key: body.template_key || null,
      use_case: record.use_case,
      risk_level: record.risk_level,
    },
  });
}

async function handleOutboundSend(req, res) {
  const context = requireCrmTenantContext(req);
  if (!context.ok) {
    return writeJson(res, context.status, { success: false, error: context.error, message: context.message });
  }
  if (req.method !== 'POST') {
    return writeJson(res, 405, { success: false, error: 'METHOD_NOT_ALLOWED' });
  }

  const decision = assertCrmMutationAllowed(context, 'outbound_send');
  if (!decision.allowed) {
    return writeJson(res, decision.status, { success: false, error: decision.error, message: decision.message });
  }

  const store = getCrmStore(req);
  const body = req.body || {};
  const contactId = String(body.contact_id || '').trim();

  let channel;
  try {
    channel = normalizeChannel(body.channel);
  } catch (error) {
    return writeJson(res, 400, { success: false, error: error.message });
  }

  const contact = findTenantContact(store, context.tenant_id, contactId);
  if (!contact) {
    return writeJson(res, 404, { success: false, error: 'CRM_OUTBOUND_CONTACT_NOT_FOUND' });
  }

  const eligibility = evaluateOutboundEligibility(store, {
    tenant_id: context.tenant_id,
    contact_id: contactId,
    channel,
    use_case: body.use_case,
    risk_level: body.risk_level,
    template_key: body.template_key,
    approval_granted: body.approval_granted === true,
    bulk_size: body.bulk_size,
  });

  if (!eligibility.allowed) {
    const blockedRecord = createOutboundRecord(store, context, body, eligibility, {
      provider: channel === 'email' ? 'resend' : 'twilio',
      provider_message_id: null,
      status: 'blocked',
    }, 'blocked');
    appendOutboundActivity(store, context, body, blockedRecord, {
      action: 'outbound_send_blocked',
      outcome: 'blocked',
      reason_code: eligibility.reason_code,
    });
    const errorCode = eligibility.requires_approval ? 'CRM_OUTBOUND_APPROVAL_REQUIRED' : 'CRM_OUTBOUND_INELIGIBLE';
    return writeJson(res, 409, {
      success: false,
      error: errorCode,
      reason_code: eligibility.reason_code,
      requires_approval: eligibility.requires_approval,
    });
  }

  const providers = req.outboundProviders || createDefaultProviderRegistry();
  const adapter = providers[channel];
  if (!adapter) {
    return writeJson(res, 500, { success: false, error: 'CRM_OUTBOUND_PROVIDER_UNAVAILABLE' });
  }

  try {
    const brandContext = getPluginBrandContext(context.tenant_id, req.brandPackConfig || {});
    const providerResult = await sendOutboundMessage(adapter, {
      tenant_id: context.tenant_id,
      contact_id: contactId,
      channel,
      to: eligibility.contact_point,
      subject: body.subject,
      body_markdown: body.body_markdown,
      template_key: body.template_key,
      brand: brandContext,
      use_case: body.use_case,
    });

    const outboundRecord = createOutboundRecord(store, context, body, eligibility, providerResult, 'sent');
    appendOutboundActivity(store, context, body, outboundRecord, {
      action: 'outbound_send_requested',
      outcome: 'sent',
    });
    return writeJson(res, 200, { success: true, send: outboundRecord });
  } catch (error) {
    const failedRecord = createOutboundRecord(store, context, body, eligibility, {
      provider: channel === 'email' ? 'resend' : 'twilio',
      provider_message_id: null,
      status: 'failed',
    }, 'failed');
    appendOutboundActivity(store, context, body, failedRecord, {
      action: 'outbound_send_blocked',
      outcome: 'failed',
      reason_code: error.code || 'CRM_OUTBOUND_PROVIDER_ERROR',
    });
    return writeJson(res, 502, { success: false, error: error.code || 'CRM_OUTBOUND_PROVIDER_ERROR', message: error.message });
  }
}

module.exports = async function handler(req, res) {
  const runtime = createRuntimeContext();
  const auth = requireHostedSupabaseAuth({ req, runtimeContext: runtime, operation: 'status_read' });
  if (!auth.ok) {
    return writeJson(res, auth.status, { success: false, error: auth.error, message: auth.message });
  }
  req.markosAuth = auth;
  return handleOutboundSend(req, res);
};

module.exports.handleOutboundSend = handleOutboundSend;