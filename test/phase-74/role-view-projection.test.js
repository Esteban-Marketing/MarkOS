const test = require('node:test');
const assert = require('node:assert/strict');

const { normalizeBrandInput } = require('../../onboarding/backend/brand-inputs/normalize-brand-input.cjs');
const { synthesizeStrategyArtifact } = require('../../onboarding/backend/brand-strategy/strategy-synthesizer.cjs');
const { compileMessagingRules } = require('../../onboarding/backend/brand-strategy/messaging-rules-compiler.cjs');
const { projectRoleViews } = require('../../onboarding/backend/brand-strategy/role-view-projector.cjs');

function buildBrandInput() {
  return {
    brand_profile: {
      primary_name: 'Projection Labs',
      mission_statement: 'Keep role outputs consistent and lineage-safe.',
    },
    audience_segments: [
      {
        segment_id: 'seg-founders',
        segment_name: 'Founder operators',
        pains: [
          { pain: 'Conflicting strategy docs', rationale: 'Every role rewrites the same brief.' },
        ],
        needs: [
          { need: 'One canonical strategy artifact', rationale: 'Teams need one source of truth.' },
        ],
        expectations: [
          { expectation: 'Actionable guidance with examples', rationale: 'Execution teams need concrete instructions.' },
        ],
        desired_outcomes: ['Faster aligned launches'],
      },
      {
        segment_id: 'seg-content',
        segment_name: 'Content leads',
        pains: [
          { pain: 'Channel-by-channel drift', rationale: 'Voice shifts each time content is repurposed.' },
        ],
        needs: [
          { need: 'Inherited voice profile by channel', rationale: 'Each channel should inherit the same core voice.' },
        ],
        expectations: [
          { expectation: 'Clear do and do-not examples', rationale: 'Writers need explicit boundaries.' },
        ],
        desired_outcomes: ['Consistent channel execution'],
      },
    ],
  };
}

function buildMessagingRules() {
  return {
    voice_profile: {
      tone: 'pragmatic',
      formality: 'professional',
      energy: 'balanced',
    },
    channel_rules: {
      site: {
        do: ['Lead with outcomes'],
        dont: ['Use exaggerated promises'],
      },
      email: {
        tone: 'empathetic',
        do: ['Reference known pain points'],
        dont: ['Overstuff copy with jargon'],
      },
      social: {
        energy: 'high',
        do: ['Keep hooks short'],
        dont: ['Use unsupported claims'],
      },
      'sales-call': {
        formality: 'executive',
        do: ['Confirm constraints before proposing next step'],
        dont: ['Promise outcomes without evidence'],
      },
    },
  };
}

test('role projector: deterministic role outputs from one canonical artifact', async () => {
  const tenantId = 'tenant-role-projection';
  const normalized = normalizeBrandInput(tenantId, buildBrandInput());

  const synth1 = synthesizeStrategyArtifact(tenantId, normalized);
  const rules1 = compileMessagingRules(synth1.artifact, buildMessagingRules(), {
    ruleset_version: synth1.metadata.ruleset_version,
  });
  const views1 = projectRoleViews(synth1, rules1);

  const synth2 = synthesizeStrategyArtifact(tenantId, normalized);
  const rules2 = compileMessagingRules(synth2.artifact, buildMessagingRules(), {
    ruleset_version: synth2.metadata.ruleset_version,
  });
  const views2 = projectRoleViews(synth2, rules2);

  assert.deepEqual(views1, views2);
  assert.equal(views1.strategist.deterministic_fingerprint, synth1.metadata.deterministic_fingerprint);
  assert.equal(views1.founder.deterministic_fingerprint, synth1.metadata.deterministic_fingerprint);
  assert.equal(views1.content.deterministic_fingerprint, synth1.metadata.deterministic_fingerprint);

  assert.deepEqual(views1.strategist.strategy_snapshot.positioning, synth1.artifact.positioning);
  assert.deepEqual(views1.founder.executive_snapshot.positioning, synth1.artifact.positioning);
  assert.deepEqual(views1.content.execution_snapshot.messaging_pillars, synth1.artifact.messaging_pillars);
});

test('role projector: projected guidance keeps lineage and do/do-not examples', async () => {
  const tenantId = 'tenant-role-guidance';
  const normalized = normalizeBrandInput(tenantId, buildBrandInput());
  const synthesized = synthesizeStrategyArtifact(tenantId, normalized);
  const compiled = compileMessagingRules(synthesized.artifact, buildMessagingRules(), {
    ruleset_version: synthesized.metadata.ruleset_version,
  });
  const views = projectRoleViews(synthesized, compiled);

  const channels = Object.keys(views.content.execution_snapshot.channel_rules);
  assert.deepEqual(channels.sort(), ['email', 'sales-call', 'site', 'social']);

  channels.forEach((channel) => {
    const rule = views.content.execution_snapshot.channel_rules[channel];
    assert.ok(Array.isArray(rule.do));
    assert.ok(Array.isArray(rule.dont));
    assert.ok(rule.do.length > 0, `${channel} should contain do guidance`);
    assert.ok(rule.dont.length > 0, `${channel} should contain do-not guidance`);

    rule.do.forEach((entry) => {
      assert.equal(typeof entry.guidance, 'string');
      assert.equal(typeof entry.example, 'string');
      assert.ok(Array.isArray(entry.evidence_node_ids));
    });

    rule.dont.forEach((entry) => {
      assert.equal(typeof entry.guidance, 'string');
      assert.equal(typeof entry.example, 'string');
      assert.ok(Array.isArray(entry.evidence_node_ids));
    });
  });

  assert.ok(Array.isArray(views.strategist.lineage_evidence_node_ids));
  assert.ok(views.strategist.lineage_evidence_node_ids.length > 0);
  assert.deepEqual(views.strategist.lineage_evidence_node_ids, views.founder.lineage_evidence_node_ids);
  assert.deepEqual(views.founder.lineage_evidence_node_ids, views.content.lineage_evidence_node_ids);
});
