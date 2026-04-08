'use strict';

const { writeJson, requireCrmTenantContext, assertCrmMutationAllowed, getCrmStore } = require('../../../lib/markos/crm/api.cjs');

function normalizeChannel(channel) {
  const normalized = String(channel || '').trim().toLowerCase();
  if (!['email', 'sms', 'whatsapp'].includes(normalized)) {
    throw new Error(`CRM_OUTBOUND_CHANNEL_INVALID:${channel}`);
  }
  return normalized;
}

function buildTemplateRecord(store, context, body = {}) {
  const now = new Date().toISOString();
  return Object.freeze({
    template_id: String(body.template_id || `template-${context.tenant_id}-${store.outboundTemplates.length + 1}`),
    tenant_id: context.tenant_id,
    template_key: String(body.template_key || '').trim(),
    channel: normalizeChannel(body.channel),
    display_name: String(body.display_name || body.template_key || 'Outbound Template').trim(),
    subject: body.subject ? String(body.subject).trim() : null,
    body_markdown: String(body.body_markdown || '').trim(),
    variables: Array.isArray(body.variables) ? body.variables.map((item) => String(item).trim()) : [],
    approval_state: String(body.approval_state || 'approved').trim(),
    created_by: context.actor_id,
    updated_by: context.actor_id,
    created_at: now,
    updated_at: now,
  });
}

async function handleOutboundTemplates(req, res) {
  const context = requireCrmTenantContext(req);
  if (!context.ok) {
    return writeJson(res, context.status, { success: false, error: context.error, message: context.message });
  }

  const store = getCrmStore(req);
  if (req.method === 'GET') {
    return writeJson(res, 200, {
      success: true,
      templates: store.outboundTemplates.filter((row) => row.tenant_id === context.tenant_id),
    });
  }

  if (req.method !== 'POST') {
    return writeJson(res, 405, { success: false, error: 'METHOD_NOT_ALLOWED' });
  }

  const decision = assertCrmMutationAllowed(context, 'outbound_send');
  if (!decision.allowed) {
    return writeJson(res, decision.status, { success: false, error: decision.error, message: decision.message });
  }

  try {
    const template = buildTemplateRecord(store, context, req.body || {});
    const existingIndex = store.outboundTemplates.findIndex((row) => row.tenant_id === context.tenant_id && row.template_key === template.template_key);
    if (existingIndex >= 0) {
      store.outboundTemplates.splice(existingIndex, 1, template);
    } else {
      store.outboundTemplates.push(template);
    }
    return writeJson(res, 200, { success: true, template });
  } catch (error) {
    return writeJson(res, 400, { success: false, error: error.message });
  }
}

module.exports = async function handler(req, res) {
  return handleOutboundTemplates(req, res);
};

module.exports.handleOutboundTemplates = handleOutboundTemplates;