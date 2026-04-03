'use strict';

const { buildDenyEvent, emitDenyTelemetry } = require('../runtime-context.cjs');

let cachedCanPerformAction = null;

function resolveCanPerformAction() {
  if (cachedCanPerformAction) {
    return cachedCanPerformAction;
  }

  const candidates = [
    '../../../lib/markos/rbac/iam-v32.js',
    '../../lib/markos/rbac/iam-v32.js',
  ];

  for (const candidate of candidates) {
    try {
      ({ canPerformAction: cachedCanPerformAction } = require(candidate));
      if (typeof cachedCanPerformAction === 'function') {
        return cachedCanPerformAction;
      }
    } catch {
      // Fall through to the next candidate.
    }
  }

  cachedCanPerformAction = () => false;
  return cachedCanPerformAction;
}

function ensureNonEmptyString(value, fieldName) {
  if (!value || String(value).trim().length === 0) {
    throw new Error(`APPROVAL_DECISION_MISSING_${fieldName.toUpperCase()}`);
  }
}

function assertAwaitingApproval(input = {}) {
  const state = typeof input === 'string' ? input : input.state;
  const runId = typeof input === 'object' ? input.run_id : undefined;

  if (state !== 'awaiting_approval') {
    const message = runId
      ? `Run '${runId}' must be in awaiting_approval before high-impact mutation.`
      : 'Run must be in awaiting_approval before high-impact mutation.';
    const err = new Error(message);
    err.code = 'AGENT_RUN_NOT_AWAITING_APPROVAL';
    throw err;
  }

  return true;
}

function defaultAuthorizationCheck(actorRole) {
  const canPerformAction = resolveCanPerformAction();

  return {
    authorized: canPerformAction(actorRole, 'approve_task'),
    statusCode: canPerformAction(actorRole, 'approve_task') ? 200 : 403,
    reason: canPerformAction(actorRole, 'approve_task')
      ? null
      : `Action 'approve_task' not permitted for role '${actorRole || 'unknown'}'`,
  };
}

function recordApprovalDecision(input = {}) {
  const {
    run_id,
    tenant_id,
    state,
    actor_id,
    actor_role,
    action,
    rationale,
    correlation_id,
    decisionStore,
    authorizationCheck = defaultAuthorizationCheck,
    buildDenyEvent: buildDeny = buildDenyEvent,
    emitDenyTelemetry: emitDeny = emitDenyTelemetry,
  } = input;

  ensureNonEmptyString(run_id, 'run_id');
  ensureNonEmptyString(tenant_id, 'tenant_id');
  ensureNonEmptyString(actor_id, 'actor_id');
  ensureNonEmptyString(actor_role, 'actor_role');
  ensureNonEmptyString(action, 'action');
  ensureNonEmptyString(correlation_id, 'correlation_id');

  if (action !== 'approved' && action !== 'rejected') {
    throw new Error('APPROVAL_DECISION_INVALID_ACTION');
  }

  assertAwaitingApproval({ run_id, state });

  if (!decisionStore || typeof decisionStore.has !== 'function' || typeof decisionStore.set !== 'function') {
    throw new Error('APPROVAL_DECISION_STORE_INVALID');
  }

  if (decisionStore.has(run_id)) {
    return {
      ok: false,
      statusCode: 409,
      error: 'APPROVAL_DECISION_IMMUTABLE',
      message: `Decision already exists for run '${run_id}'.`,
      decision: decisionStore.get(run_id),
    };
  }

  const authResult = authorizationCheck(actor_role, 'approve_task');
  if (!authResult || !authResult.authorized) {
    const denyEvent = buildDeny({
      actor_id,
      tenant_id,
      action: 'approve_task',
      reason: authResult && authResult.reason ? authResult.reason : 'approval_authorization_denied',
      request_id: correlation_id,
    });
    emitDeny(denyEvent);

    return {
      ok: false,
      statusCode: (authResult && authResult.statusCode) || 403,
      error: 'AUTHORIZATION_DENIED',
      message: (authResult && authResult.reason) || 'Approval authorization denied.',
      deny_event: denyEvent,
    };
  }

  const decision = {
    decision_id: `decision_${run_id}`,
    run_id,
    tenant_id,
    decision: action,
    actor_id,
    actor_role,
    rationale: rationale || null,
    correlation_id,
    created_at: new Date().toISOString(),
  };

  decisionStore.set(run_id, decision);

  return {
    ok: true,
    statusCode: 200,
    error: null,
    decision,
  };
}

module.exports = {
  assertAwaitingApproval,
  recordApprovalDecision,
};