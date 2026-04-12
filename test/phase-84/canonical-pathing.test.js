const test = require('node:test');
const assert = require('node:assert/strict');

const {
  resolveDeterministicDestination,
  getDisciplineRoot,
} = require('../../onboarding/backend/vault/destination-map.cjs');
const { buildSemanticIndexManifests } = require('../../onboarding/backend/vault/semantic-index-manifest.cjs');

test('84-01 deterministic destination mapping returns identical canonical path for identical inputs', () => {
  const input = {
    config: { canonical_vault: { root_path: 'MarkOS-Vault' } },
    discipline: 'strategy',
    sectionKey: 'company_profile',
    slug: 'acme-positioning',
    projectSlug: 'acme',
    audience: ['founders'],
    funnel: ['consideration'],
    concepts: ['positioning'],
  };

  const first = resolveDeterministicDestination(input);
  const second = resolveDeterministicDestination(input);

  assert.equal(first.destination_path, second.destination_path);
  assert.equal(first.note_id, second.note_id);
  assert.equal(first.discipline_root, getDisciplineRoot('strategy'));
});

test('84-01 discipline root remains primary and semantic cross-cutting indices are manifest artifacts', () => {
  const destination = resolveDeterministicDestination({
    config: { canonical_vault: { root_path: 'MarkOS-Vault' } },
    discipline: 'execution',
    sectionKey: 'channel_strategy',
    slug: 'omnichannel-plan',
    projectSlug: 'acme',
    audience: ['operators'],
    funnel: ['decision'],
    concepts: ['attribution'],
  });

  const manifests = buildSemanticIndexManifests({
    destination,
    audience: ['operators'],
    funnel: ['decision'],
    concepts: ['attribution'],
  });

  assert.match(destination.destination_path, /MarkOS-Vault\/Disciplines\/Execution\//);
  assert.equal(manifests.length, 3);
  assert.ok(manifests.every((entry) => entry.discipline_root_path === destination.discipline_root_path));
  assert.ok(manifests.every((entry) => entry.manifest_path.includes('Semantic-Index')));
});

test('84-01 mapping fails closed on unknown discipline with deterministic error code', () => {
  assert.throws(() => {
    resolveDeterministicDestination({
      config: { canonical_vault: { root_path: 'MarkOS-Vault' } },
      discipline: 'unknown',
      sectionKey: 'company_profile',
      slug: 'acme-positioning',
      projectSlug: 'acme',
    });
  }, (error) => error && error.code === 'E_UNKNOWN_DISCIPLINE');
});

test('84-01 mapping fails closed on unstable slug normalization with deterministic error code', () => {
  assert.throws(() => {
    resolveDeterministicDestination({
      config: { canonical_vault: { root_path: 'MarkOS-Vault' } },
      discipline: 'strategy',
      sectionKey: 'company_profile',
      slug: 'Acme Positioning 2026',
      projectSlug: 'acme',
    });
  }, (error) => error && error.code === 'E_UNSTABLE_SLUG');
});
