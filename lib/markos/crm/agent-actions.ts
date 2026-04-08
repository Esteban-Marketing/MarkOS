export type __ModuleMarker = import('node:fs').Stats;

'use strict';

const { canPerformAction } = require('../rbac/iam-v32.js');
const { appendCrmActivity, getCrmStore } = require('./api.cjs');

const MUTATION_FAMILY_TO_ACTION = Object.freeze({
  create_task: 'package_copilot_action',
  append_note: 'package_copilot_action',
  propose_enrichment: 'package_copilot_action',
  update_owner: 'package_copilot_action',
  update_stage: 'package_copilot_action',
});

function assertAgentMutationAllowed(
  context: Record<string, unknown> = {},
  mutationFamily: unknown,
  options: Record<string, unknown> = {},
) {
  const tenantId = String(context.tenant_id || '').trim();
  if (!tenantId) {
    return {
      allowed: false,
      status: 401,
      error: 'TENANT_CONTEXT_REQUIRED',
      message: 'Copilot mutations require tenant context.',
    };
  }

  const family = String(mutationFamily || '').trim();
  const policyAction = MUTATION_FAMILY_TO_ACTION[family];
  if (!policyAction) {
    return {
      allowed: false,
      status: 400,
      error: 'CRM_AGENT_MUTATION_INVALID',
      message: `Unknown copilot mutation family '${family}'.`,
    };
  }

  const role = String(context.iamRole || '').trim();
  if (!canPerformAction(role, policyAction)) {
    return {
      allowed: false,
      status: 403,
      error: 'CRM_AGENT_MUTATION_FORBIDDEN',
      message: `Role '${role}' cannot package CRM copilot mutation '${family}'.`,
    };
  }

  const reviewTenantId = options.review_tenant_id ? String(options.review_tenant_id).trim() : tenantId;
  if (reviewTenantId !== tenantId && !canPerformAction(role, 'review_cross_tenant_copilot')) {
    return {
      allowed: false,
      status: 403,
      error: 'CRM_COPILOT_OVERSIGHT_FORBIDDEN',
      message: 'Cross-tenant copilot oversight requires explicit owner authorization.',
    };
  }

  return {
    allowed: true,
    approval_required: true,
    review_tenant_id: reviewTenantId,
    action: policyAction,
  };
}

function buildApprovalPackage(input: Record<string, unknown> = {}) {
  const tenantId = String(input.tenant_id || '').trim();
  const reviewTenantId = String(input.review_tenant_id || tenantId).trim();
  const mutationFamily = String(input.mutation_family || '').trim();
  const packageId = String(input.package_id || `copilot-package-${Date.now()}`);
  return Object.freeze({
    package_id: packageId,
    tenant_id: tenantId,
    review_tenant_id: reviewTenantId,
    run_id: String(input.run_id || `${packageId}:run`),
    mutation_family: mutationFamily,
    target_record_kind: input.target_record_kind ? String(input.target_record_kind).trim() : null,
    target_record_id: input.target_record_id ? String(input.target_record_id).trim() : null,
    approval_required: true,
    status: String(input.status || 'awaiting_approval'),
    actor_id: input.actor_id ? String(input.actor_id).trim() : null,
    actor_role: input.actor_role ? String(input.actor_role).trim() : null,
    rationale: input.rationale && typeof input.rationale === 'object' ? { ...input.rationale } : {},
    evidence: Array.isArray(input.evidence) ? input.evidence.map((entry) => ({ ...entry })) : [],
    proposed_changes: input.proposed_changes && typeof input.proposed_changes === 'object' ? { ...input.proposed_changes } : {},
    immutable_lineage: {
      correlation_id: input.correlation_id ? String(input.correlation_id).trim() : null,
      request_id: input.request_id ? String(input.request_id).trim() : null,
      created_at: input.created_at || new Date().toISOString(),
    },
  });
}

function recordAgentMutationOutcome(store, input: Record<string, unknown> = {}) {
  const targetStore = getCrmStore({ crmStore: store });
  const row = Object.freeze({
    outcome_id: String(input.outcome_id || `copilot-outcome-${targetStore.copilotMutationOutcomes.length + 1}`),
    package_id: String(input.package_id || '').trim(),
    tenant_id: String(input.tenant_id || '').trim(),
    review_tenant_id: String(input.review_tenant_id || input.tenant_id || '').trim(),
    run_id: String(input.run_id || '').trim(),
    mutation_family: String(input.mutation_family || '').trim(),
    status: String(input.status || 'recorded').trim(),
    actor_id: String(input.actor_id || '').trim(),
    actor_role: String(input.actor_role || '').trim(),
    payload_json: input.payload_json && typeof input.payload_json === 'object' ? { ...input.payload_json } : {},
    created_at: input.created_at || new Date().toISOString(),
  });
  targetStore.copilotMutationOutcomes.push(row);
  appendCrmActivity(targetStore, {
    tenant_id: row.review_tenant_id || row.tenant_id,
    activity_family: 'agent_event',
    related_record_kind: input.related_record_kind || 'copilot_package',
    related_record_id: input.related_record_id || row.package_id,
    source_event_ref: `api:crm:copilot:mutation:${row.status}:${row.package_id}`,
    actor_id: row.actor_id,
    payload_json: {
      action: 'copilot_mutation_outcome_recorded',
      package_id: row.package_id,
      run_id: row.run_id,
      mutation_family: row.mutation_family,
      status: row.status,
      actor_role: row.actor_role,
      ...(row.payload_json || {}),
    },
  });
  return row;
}

module.exports = {
  buildApprovalPackage,
  assertAgentMutationAllowed,
  recordAgentMutationOutcome,
};