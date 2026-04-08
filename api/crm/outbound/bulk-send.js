'use strict';

const {
  writeJson,
  requireCrmTenantContext,
  assertCrmMutationAllowed,
  getCrmStore,
  appendCrmActivity,
} = require('../../../lib/markos/crm/api.cjs');
const { evaluateOutboundEligibility } = require('../../../lib/markos/outbound/consent.ts');

function normalizeChannel(channel) {
  const normalized = String(channel || '').trim().toLowerCase();
  if (!['email', 'sms', 'whatsapp'].includes(normalized)) {
    throw new Error(`CRM_OUTBOUND_CHANNEL_INVALID:${channel}`);
  }
  return normalized;
}

function createBulkRecord(store, context, body, counts) {
  const now = new Date().toISOString();
  return Object.freeze({
    bulk_send_id: `bulk-${context.tenant_id}-${store.outboundBulkSends.length + 1}`,
    tenant_id: context.tenant_id,
    channel: normalizeChannel(body.channel),
    record_kind: String(body.record_kind || 'contact').trim(),
    use_case: String(body.use_case || 'marketing').trim(),
    subject: body.subject ? String(body.subject).trim() : null,
    body_markdown: String(body.body_markdown || '').trim(),
    schedule_at: body.schedule_at ? new Date(body.schedule_at).toISOString() : now,
    approval_required: true,
    approval_state: body.approval_granted === true ? 'approved' : 'pending_approval',
    total_contacts: counts.total,
    eligible_contacts: counts.eligible,
    blocked_contacts: counts.blocked,
    created_by: context.actor_id,
    created_at: now,
    updated_at: now,
  });
}

async function handleBulkOutboundSend(req, res) {
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
  const contactIds = Array.isArray(body.contact_ids) ? body.contact_ids.map((item) => String(item).trim()).filter(Boolean) : [];
  if (contactIds.length === 0) {
    return writeJson(res, 400, { success: false, error: 'CRM_OUTBOUND_CONTACTS_REQUIRED' });
  }

  if (body.approval_granted === true) {
    const approvalDecision = assertCrmMutationAllowed(context, 'outbound_approve');
    if (!approvalDecision.allowed) {
      return writeJson(res, approvalDecision.status, { success: false, error: approvalDecision.error, message: approvalDecision.message });
    }
  }

  const preview = contactIds.map((contactId) => ({
    contact_id: contactId,
    eligibility: evaluateOutboundEligibility(store, {
      tenant_id: context.tenant_id,
      contact_id: contactId,
      channel: body.channel,
      use_case: body.use_case,
      risk_level: body.risk_level,
      template_key: body.template_key,
      approval_granted: body.approval_granted === true,
      bulk_size: contactIds.length,
    }),
  }));

  if (body.approval_granted !== true) {
    return writeJson(res, 409, {
      success: false,
      error: 'CRM_OUTBOUND_APPROVAL_REQUIRED',
      total_contacts: contactIds.length,
      blocked_contacts: preview.filter((item) => !item.eligibility.allowed).length,
    });
  }

  const eligible = preview.filter((item) => item.eligibility.allowed);
  const blocked = preview.filter((item) => !item.eligibility.allowed);
  const bulk = createBulkRecord(store, context, body, {
    total: contactIds.length,
    eligible: eligible.length,
    blocked: blocked.length,
  });
  store.outboundBulkSends.push(bulk);

  const scheduledAt = body.schedule_at ? new Date(body.schedule_at).toISOString() : new Date().toISOString();
  const queueItems = eligible.map((item, index) => {
    const row = Object.freeze({
      queue_id: `queue-${context.tenant_id}-${store.outboundQueue.length + index + 1}`,
      tenant_id: context.tenant_id,
      work_type: 'bulk_send',
      status: 'scheduled',
      due_at: scheduledAt,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      contact_id: item.contact_id,
      record_kind: String(body.record_kind || 'contact').trim(),
      record_id: item.contact_id,
      channel: normalizeChannel(body.channel),
      template_key: body.template_key ? String(body.template_key).trim() : null,
      sequence_id: null,
      sequence_key: null,
      sequence_step_id: null,
      approval_state: 'approved',
      bulk_send_id: bulk.bulk_send_id,
    });
    store.outboundQueue.push(row);
    return row;
  });

  appendCrmActivity(store, {
    tenant_id: context.tenant_id,
    activity_family: 'outbound_event',
    related_record_kind: String(body.record_kind || 'contact').trim(),
    related_record_id: bulk.bulk_send_id,
    source_event_ref: `api:crm:outbound:bulk:${bulk.bulk_send_id}`,
    actor_id: context.actor_id,
    payload_json: {
      action: 'outbound_bulk_scheduled',
      outcome: 'scheduled',
      bulk_send_id: bulk.bulk_send_id,
      eligible_contacts: eligible.length,
      blocked_contacts: blocked.length,
    },
  });

  return writeJson(res, 200, {
    success: true,
    bulk,
    queue: queueItems,
    blocked_contacts: blocked.map((item) => ({
      contact_id: item.contact_id,
      reason_code: item.eligibility.reason_code,
    })),
  });
}

module.exports = async function handler(req, res) {
  return handleBulkOutboundSend(req, res);
};

module.exports.handleBulkOutboundSend = handleBulkOutboundSend;