const test = require('node:test');
const assert = require('node:assert/strict');

const {
  RUN_STATES,
  createRunEnvelope,
  assertTransitionAllowed,
  createInMemoryEventStore,
} = require('../../onboarding/backend/agents/run-engine.cjs');

const ALLOWED_EDGES = [
  ['requested', 'accepted'],
  ['accepted', 'context_loaded'],
  ['context_loaded', 'executing'],
  ['executing', 'awaiting_approval'],
  ['awaiting_approval', 'approved'],
  ['awaiting_approval', 'rejected'],
  ['approved', 'executing'],
  ['executing', 'completed'],
  ['executing', 'failed'],
  ['completed', 'archived'],
  ['failed', 'archived'],
  ['rejected', 'archived'],
];

test('53-01-01: run engine exports canonical lifecycle states', () => {
  assert.ok(Array.isArray(RUN_STATES));
  assert.deepEqual(
    RUN_STATES,
    ['requested', 'accepted', 'context_loaded', 'executing', 'awaiting_approval', 'approved', 'rejected', 'completed', 'failed', 'archived']
  );
});

test('53-01-01: createRunEnvelope fails closed when tenant context is missing', () => {
  assert.throws(
    () => createRunEnvelope({
      actor_id: 'actor-1',
      correlation_id: 'corr-1',
      provider_policy: { primary_provider: 'openai' },
      tool_policy: { profile: 'default' },
    }),
    /tenant_id/i
  );
});

test('53-01-01: createRunEnvelope fails closed when principal metadata is missing', () => {
  assert.throws(
    () => createRunEnvelope({
      tenant_id: 'tenant-1',
      correlation_id: 'corr-1',
      provider_policy: { primary_provider: 'openai' },
      tool_policy: { profile: 'default' },
    }),
    /actor_id/i
  );
});

test('53-01-01: createRunEnvelope fails closed when policy metadata is missing', () => {
  assert.throws(
    () => createRunEnvelope({
      tenant_id: 'tenant-1',
      actor_id: 'actor-1',
      correlation_id: 'corr-1',
      provider_policy: null,
      tool_policy: { profile: 'default' },
    }),
    /provider_policy|policy/i
  );
});

test('53-01-01: canonical AGT-02 transitions are allowed and produce transition events', () => {
  const eventStore = createInMemoryEventStore();

  for (const [from, to] of ALLOWED_EDGES) {
    const result = assertTransitionAllowed({
      run_id: 'run-1',
      tenant_id: 'tenant-1',
      from_state: from,
      to_state: to,
      eventStore,
      reason: 'contract-test',
    });

    assert.equal(result.allowed, true);
    assert.equal(result.from_state, from);
    assert.equal(result.to_state, to);
  }

  const events = eventStore.listEventsForRun('run-1');
  assert.equal(events.length, ALLOWED_EDGES.length);
  assert.equal(events.every((event) => event.event_type === 'agent_run_transitioned'), true);
});

test('53-01-01: all non-canonical transitions are denied and audit logged', () => {
  const eventStore = createInMemoryEventStore();
  const states = ['requested', 'accepted', 'context_loaded', 'executing', 'awaiting_approval', 'approved', 'rejected', 'completed', 'failed', 'archived'];
  const allowedEdgeKey = new Set(ALLOWED_EDGES.map(([from, to]) => `${from}->${to}`));

  for (const from of states) {
    for (const to of states) {
      const edgeKey = `${from}->${to}`;
      if (allowedEdgeKey.has(edgeKey)) {
        continue;
      }

      const result = assertTransitionAllowed({
        run_id: 'run-2',
        tenant_id: 'tenant-1',
        from_state: from,
        to_state: to,
        eventStore,
        reason: 'illegal-edge-test',
      });

      assert.equal(result.allowed, false);
      assert.equal(result.error_code, 'AGENT_RUN_INVALID_TRANSITION');
    }
  }

  const deniedEvents = eventStore.listEventsForRun('run-2').filter((event) => event.event_type === 'agent_run_transition_denied');
  assert.ok(deniedEvents.length > 0);
});
