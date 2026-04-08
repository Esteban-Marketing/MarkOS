const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildGovernanceEvidencePack } = require('../../lib/markos/governance/evidence-pack.cjs');

const runtimeContext = require('../../onboarding/backend/runtime-context.cjs');
const telemetry = require('../../onboarding/backend/agents/telemetry.cjs');
const {
  assertAwaitingApproval,
  recordApprovalDecision,
} = require('../../onboarding/backend/agents/approval-gate.cjs');
const handlers = require('../../onboarding/backend/handlers.cjs');

const { buildDenyEvent } = runtimeContext;

function createDecisionStore() {
  const decisions = new Map();
  return {
    has(runId) {
      return decisions.has(runId);
    },
    get(runId) {
      return decisions.get(runId);
    },
    set(runId, value) {
      decisions.set(runId, value);
    },
    size() {
      return decisions.size;
    },
  };
}

test('53-02-01: high-impact mutation is blocked unless run state is awaiting_approval', () => {
  assert.throws(
    () => assertAwaitingApproval({ run_id: 'run-1', state: 'executing' }),
    /awaiting_approval/i
  );

  assert.doesNotThrow(() => assertAwaitingApproval({ run_id: 'run-1', state: 'awaiting_approval' }));
});

test('53-02-01: unauthorized approval attempts include deny telemetry payload fields', () => {
  const store = createDecisionStore();
  const denyEvents = [];

  const result = recordApprovalDecision({
    run_id: 'run-unauthorized',
    tenant_id: 'tenant-1',
    state: 'awaiting_approval',
    actor_id: 'actor-1',
    actor_role: 'readonly',
    action: 'approved',
    rationale: 'attempt unauthorized approval',
    correlation_id: 'corr-53-02',
    decisionStore: store,
    authorizationCheck: () => ({ authorized: false, statusCode: 403, reason: 'forbidden' }),
    buildDenyEvent,
    emitDenyTelemetry: (event) => {
      denyEvents.push(event);
      return { ok: true };
    },
  });

  assert.equal(result.ok, false);
  assert.equal(result.statusCode, 403);
  assert.equal(denyEvents.length, 1);
  assert.equal(Boolean(denyEvents[0].actor_id), true);
  assert.equal(Boolean(denyEvents[0].tenant_id), true);
  assert.equal(Boolean(denyEvents[0].action), true);
  assert.equal(Boolean(denyEvents[0].correlation_id), true);
});

test('53-02-01: approval decision writes are immutable once recorded for a run', () => {
  const store = createDecisionStore();
  const allow = () => ({ authorized: true, statusCode: 200, reason: null });

  const first = recordApprovalDecision({
    run_id: 'run-immutable',
    tenant_id: 'tenant-1',
    state: 'awaiting_approval',
    actor_id: 'reviewer-1',
    actor_role: 'reviewer',
    action: 'approved',
    rationale: 'approved',
    correlation_id: 'corr-immutable-1',
    decisionStore: store,
    authorizationCheck: allow,
    buildDenyEvent,
    emitDenyTelemetry: () => ({ ok: true }),
  });

  assert.equal(first.ok, true);

  const second = recordApprovalDecision({
    run_id: 'run-immutable',
    tenant_id: 'tenant-1',
    state: 'awaiting_approval',
    actor_id: 'reviewer-2',
    actor_role: 'reviewer',
    action: 'rejected',
    rationale: 'attempt overwrite',
    correlation_id: 'corr-immutable-2',
    decisionStore: store,
    authorizationCheck: allow,
    buildDenyEvent,
    emitDenyTelemetry: () => ({ ok: true }),
  });

  assert.equal(second.ok, false);
  assert.match(second.error, /immutable|already/i);
  assert.equal(store.size(), 1);
});

test('53-02-01: unauthorized approval attempts are durably emitted to deny telemetry', () => {
  const store = createDecisionStore();
  const captured = [];
  const originalCapture = telemetry.capture;

  telemetry.capture = (eventName, payload) => {
    captured.push({ eventName, payload });
  };

  try {
    const result = recordApprovalDecision({
      run_id: 'run-deny-emit',
      tenant_id: 'tenant-1',
      state: 'awaiting_approval',
      actor_id: 'actor-1',
      actor_role: 'readonly',
      action: 'approved',
      rationale: 'attempt unauthorized approval',
      correlation_id: 'corr-deny-emit',
      decisionStore: store,
      authorizationCheck: () => ({ authorized: false, statusCode: 403, reason: 'forbidden' }),
      buildDenyEvent,
      emitDenyTelemetry: runtimeContext.emitDenyTelemetry,
    });

    assert.equal(result.ok, false);
    assert.equal(captured.length, 1);
    assert.equal(captured[0].eventName, 'markos_tenant_access_denied');
    assert.equal(captured[0].payload.actor_id, 'actor-1');
    assert.equal(captured[0].payload.tenant_id, 'tenant-1');
    assert.equal(captured[0].payload.correlation_id, 'corr-deny-emit');
  } finally {
    telemetry.capture = originalCapture;
  }
});

test('53-02-03: handler IAM authorization denies unknown roles with immutable deny telemetry context', () => {
  const req = {
    headers: {
      'x-request-id': 'req-53-02-deny',
      'x-correlation-id': 'corr-53-02-deny',
    },
    markosAuth: {
      tenant_id: 'tenant-1',
      iamRole: 'unknown_role',
      principal: { id: 'actor-1' },
      request_id: 'req-53-02-deny',
      correlation_id: 'corr-53-02-deny',
    },
  };

  const result = handlers.__testing.checkActionAuthorization('approve_task', req);
  assert.equal(result.authorized, false);
  assert.equal(result.statusCode, 403);
  assert.equal(Boolean(result.denyEvent.actor_id), true);
  assert.equal(Boolean(result.denyEvent.tenant_id), true);
  assert.equal(Boolean(result.denyEvent.action), true);
  assert.equal(Boolean(result.denyEvent.correlation_id), true);
});

test('53-02-03: approve handler is wired to awaiting_approval gate before side effects', () => {
  const handlersSource = fs.readFileSync(
    path.join(__dirname, '../../onboarding/backend/handlers.cjs'),
    'utf8'
  );

  assert.match(handlersSource, /handleApprove[\s\S]*assertAwaitingApproval\(/);
  assert.match(handlersSource, /handleApprove[\s\S]*recordApprovalDecision\(/);
  assert.match(handlersSource, /writeMIR\.applyDrafts/);
});

test('SEC-01 governance evidence: approvals family cites immutable approval decision provenance', () => {
  const pack = buildGovernanceEvidencePack();
  const approvalsFamily = pack.privileged_action_families.find((family) => family.action_family === 'approvals');

  assert.ok(approvalsFamily);
  assert.equal(approvalsFamily.evidence_source, 'agent_approval_decision_log');
  assert.ok(approvalsFamily.actions.includes('approval_decision_recorded'));
  assert.ok(approvalsFamily.immutable_provenance_fields.includes('actor_role'));
});