const test = require('node:test');
const assert = require('node:assert/strict');

const {
  evaluateActivationReadiness,
} = require('../../onboarding/backend/literacy/activation-readiness.cjs');

function createSeed() {
  return {
    company: { business_model: 'SaaS' },
    audience: { pain_points: ['low conversions'] },
    content: { active_channels: ['Google Ads', 'Email'] },
  };
}

test('blocks MSP activation until all required MIR Gate 1 entities are complete', () => {
  const result = evaluateActivationReadiness({
    seed: createSeed(),
    gate1Snapshot: {
      tenant_id: 'tenant-1',
      project_slug: 'acme',
      entity_status: {
        company_profile: 'complete',
        mission_values: 'complete',
        audience: 'missing',
        competitive: 'complete',
        brand_voice: 'complete',
      },
    },
  });

  assert.equal(result.readiness, 'blocked');
  assert.equal(result.gate1_status, 'blocked');
  assert.deepEqual(result.missing_entities, ['audience']);
  assert.match(result.reason, /MIR Gate 1/i);
});

test('returns ready activation state only when Gate 1 is complete and persists initialization inputs', () => {
  const result = evaluateActivationReadiness({
    seed: createSeed(),
    gate1Snapshot: {
      tenant_id: 'tenant-1',
      project_slug: 'acme',
      initialized_at: '2026-04-03T00:00:00.000Z',
      entity_status: {
        company_profile: 'complete',
        mission_values: 'complete',
        audience: 'complete',
        competitive: 'complete',
        brand_voice: 'complete',
      },
    },
  });

  assert.equal(result.readiness, 'ready');
  assert.equal(result.gate1_status, 'ready');
  assert.deepEqual(result.missing_entities, []);
  assert.equal(result.initialization_snapshot.tenant_id, 'tenant-1');
  assert.equal(result.initialization_snapshot.project_slug, 'acme');
});