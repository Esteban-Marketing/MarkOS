const test = require('node:test');
const assert = require('node:assert/strict');

const {
  validateProvenance,
  normalizeProvenance,
} = require('../../onboarding/backend/vault/provenance-contract.cjs');
const { writeApprovedDrafts } = require('../../onboarding/backend/vault/vault-writer.cjs');

test('84-01 provenance contract requires source, timestamp, actor, and lineage', () => {
  const normalized = normalizeProvenance({
    source: { system: 'onboarding', kind: 'draft' },
    timestamp: '2026-04-12T00:00:00.000Z',
    actor: { id: 'acme-operator', type: 'human' },
    lineage: ['draft', 'canonical-vault-note'],
    joins: {
      audience: ['operators'],
      pain_point_tags: ['ambiguity'],
    },
  });

  const validated = validateProvenance(normalized);
  assert.equal(validated.source.system, 'onboarding');
  assert.equal(validated.actor.id, 'acme-operator');
  assert.deepEqual(validated.lineage, ['draft', 'canonical-vault-note']);
});

test('84-01 vault writer fails closed when provenance keys are missing', () => {
  assert.throws(() => {
    writeApprovedDrafts({
      config: {
        canonical_vault: { root_path: 'MarkOS-Vault' },
      },
      projectSlug: 'acme',
      provenance: {
        source: { system: 'onboarding', kind: 'draft' },
        timestamp: '2026-04-12T00:00:00.000Z',
        lineage: ['draft'],
      },
      approvedDrafts: {
        company_profile: '## Snapshot\n\nAcme helps operators.',
      },
    });
  }, (error) => error && error.code === 'E_PROVENANCE_MISSING_ACTOR');
});

test('84-01 provenance shape remains indexable by audience and pain-point joins', () => {
  const validated = validateProvenance({
    source: { system: 'onboarding', kind: 'draft' },
    timestamp: '2026-04-12T00:00:00.000Z',
    actor: { id: 'acme-operator', type: 'human' },
    lineage: ['draft', 'canonical-vault-note'],
    joins: {
      audience: ['operators', 'founders'],
      pain_point_tags: ['ambiguity', 'retrieval-governance'],
    },
  });

  assert.deepEqual(validated.joins.audience, ['operators', 'founders']);
  assert.deepEqual(validated.joins.pain_point_tags, ['ambiguity', 'retrieval-governance']);
});
