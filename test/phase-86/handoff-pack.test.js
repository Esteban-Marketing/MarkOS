'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { buildHandoffPack } = require('../../onboarding/backend/vault/handoff-pack.cjs');

function makeArtifact(overrides = {}) {
  return {
    tenant_id: 'tenant-alpha',
    doc_id: 'doc-001',
    content_hash: 'sha256-abc123',
    observed_at: new Date('2025-01-15T10:00:00Z'),
    appended_at: new Date('2025-01-15T09:00:00Z'),
    content: 'raw content here',
    discipline: 'Paid_Media',
    audience: ['ICP:smb'],
    pain_point_tags: ['PAIN:budget-constraints'],
    business_model: 'B2B-SaaS',
    provenance: {
      source: { system: 'hubspot', kind: 'contact-record' },
      actor: { id: 'user-789', type: 'human' },
      timestamp: new Date('2025-01-15T10:00:00Z'),
    },
    idempotency_key: 'ingest:tenant-alpha:doc-001:hubspot:sha256-abc123',
    ...overrides,
  };
}

test('buildHandoffPack — idempotency key format', async (t) => {
  const artifact = makeArtifact();
  const pack = buildHandoffPack({ mode: 'reason', artifact });
  
  assert.match(pack.idempotency_key, /^retrieve:tenant-alpha:doc-001:reason:sha256-abc123$/);
});

test('buildHandoffPack — determinism', async (t) => {
  const artifact = makeArtifact();
  
  const pack1 = buildHandoffPack({ mode: 'reason', artifact });
  const pack2 = buildHandoffPack({ mode: 'reason', artifact });
  
  assert.equal(pack1.idempotency_key, pack2.idempotency_key);
});

test('buildHandoffPack — Reason mode has raw_content, no template_context, no verification_hook', async (t) => {
  const artifact = makeArtifact();
  const pack = buildHandoffPack({ mode: 'reason', artifact });
  
  assert.ok('raw_content' in pack);
  assert.equal(pack.mode, 'reason');
  assert.ok(!('template_context' in pack));
  assert.ok(!('verification_hook' in pack));
});

test('buildHandoffPack — Apply mode has template_context, no raw_content, no verification_hook', async (t) => {
  const artifact = makeArtifact();
  const pack = buildHandoffPack({ mode: 'apply', artifact });
  
  assert.ok('template_context' in pack);
  assert.equal(pack.mode, 'apply');
  assert.ok(!('raw_content' in pack));
  assert.ok(!('verification_hook' in pack));
});

test('buildHandoffPack — Iterate mode has verification_hook, no raw_content, no template_context', async (t) => {
  const artifact = makeArtifact();
  const pack = buildHandoffPack({ mode: 'iterate', artifact });
  
  assert.ok('verification_hook' in pack);
  assert.equal(pack.mode, 'iterate');
  assert.ok(!('raw_content' in pack));
  assert.ok(!('template_context' in pack));
});

test('buildHandoffPack — retrieved_at equals artifact.observed_at', async (t) => {
  const artifact = makeArtifact();
  const pack = buildHandoffPack({ mode: 'reason', artifact });
  
  assert.equal(pack.retrieved_at.getTime(), artifact.observed_at.getTime());
});

test('buildHandoffPack — evidence_links structure', async (t) => {
  const artifact = makeArtifact();
  const pack = buildHandoffPack({ mode: 'reason', artifact });
  
  assert.ok(Array.isArray(pack.evidence_links));
  assert.ok(pack.evidence_links.length > 0);
  
  const link = pack.evidence_links[0];
  assert.ok('artifact_id' in link);
  assert.ok('audit_idempotency_key' in link);
  assert.ok('provenance_summary' in link);
});
