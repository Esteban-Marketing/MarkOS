const test = require('node:test');
const assert = require('node:assert/strict');

const { buildDenyEvent } = require('../../onboarding/backend/runtime-context.cjs');
const {
  assertAwaitingApproval,
  recordApprovalDecision,
} = require('../../onboarding/backend/agents/approval-gate.cjs');

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