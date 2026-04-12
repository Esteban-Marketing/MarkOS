'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { validateAudienceMetadata } = require('../../onboarding/backend/vault/audience-schema.cjs');
const { checkVisibilityScope, projectAuditLineage } = require('../../onboarding/backend/vault/visibility-scope.cjs');
const { createSyncService } = require('../../onboarding/backend/vault/sync-service.cjs');

// Test 1: Audience metadata required and schema-validated at ingest entry (LITV-04 / D-03)
test('85-04 audience metadata is required and schema-validated at ingest entry', () => {
  assert.throws(
    () => validateAudienceMetadata({}),
    { code: 'E_AUDIENCE_METADATA_REQUIRED' }
  );

  assert.throws(
    () => validateAudienceMetadata({
      discipline: 'Paid_Media',
      audience: ['BAD_TAG'],
      business_model: 'B2B',
      pain_point_tags: ['cac'],
    }),
    { code: 'E_AUDIENCE_TAG_INVALID' }
  );

  const valid = validateAudienceMetadata({
    discipline: 'Paid_Media',
    audience: ['ICP:SMB'],
    business_model: 'B2B',
    pain_point_tags: ['high_cac'],
  });
  assert.deepStrictEqual(valid.audience, ['ICP:SMB']);
  assert.equal(valid.discipline, 'Paid_Media');
});

// Test 2: Unauthorized scope denied — fail-closed (LITV-04 / D-07)
test('85-04 unauthorized tenant cannot access sync lineage visibility', () => {
  const result = checkVisibilityScope(
    { tenantId: 'tenant-evil', role: 'operator' },
    { tenantId: 'tenant-alpha', docId: 'paid-media/doc.md' }
  );
  assert.equal(result.allowed, false);
  assert.equal(result.code, 'E_SCOPE_TENANT_MISMATCH');
});

test('85-04 missing claims are denied without leaking resource metadata', () => {
  const result = checkVisibilityScope(
    { tenantId: '', role: '' },
    { tenantId: 'tenant-alpha', docId: 'paid-media/doc.md' }
  );
  assert.equal(result.allowed, false);
  assert.equal(result.code, 'E_SCOPE_CLAIMS_MISSING');
});

// Test 3: Authorized scope can inspect own lineage without cross-tenant exposure (D-07)
test('85-04 authorized tenant operator can access own ingestion lineage', () => {
  const result = checkVisibilityScope(
    { tenantId: 'tenant-alpha', role: 'operator' },
    { tenantId: 'tenant-alpha', docId: 'paid-media/doc.md' }
  );
  assert.equal(result.allowed, true);
  assert.equal(result.code, null);
});

test('85-04 audit lineage projection strips cross-tenant records', () => {
  const records = [
    { tenant_id: 'tenant-alpha', doc_id: 'paid-media/doc.md', event_type: 'change' },
    { tenant_id: 'tenant-beta', doc_id: 'content/other.md', event_type: 'add' },
    { tenant_id: 'tenant-alpha', doc_id: 'content-seo/guide.md', event_type: 'add' },
  ];

  const visible = projectAuditLineage({ tenantId: 'tenant-alpha' }, records);
  assert.equal(visible.length, 2);
  assert.ok(visible.every((r) => r.tenant_id === 'tenant-alpha'));
});

test('85-04 empty claims produce empty lineage projection', () => {
  const records = [
    { tenant_id: 'tenant-alpha', doc_id: 'paid-media/doc.md', event_type: 'change' },
  ];

  const visible = projectAuditLineage({ tenantId: '' }, records);
  assert.equal(visible.length, 0);
});

// Test 4: Edits propagate without manual publish after all wave integrations (D-05 / LITV-01)
test('85-04 edits propagate end-to-end without manual publish action', async () => {
  const ingested = [];

  const svc = createSyncService({
    tenantId: 'tenant-alpha',
    vaultRoot: '/vault',
    ingestEvent: async (event) => {
      ingested.push(event);
      return { outcome: 'applied' };
    },
  });

  const result = await svc.handleChange('/vault/Paid_Media/doc.md', {
    metadata: {
      discipline: 'Paid_Media',
      audience: ['ICP:SMB'],
      business_model: 'B2B',
      pain_point_tags: ['high_cac'],
    },
  });

  assert.equal(ingested.length, 1);
  assert.equal(ingested[0].requires_manual_publish, false);
  assert.equal(result.outcome, 'applied');
});

test('85-04 sync service rejects ingest with invalid audience metadata', async () => {
  const svc = createSyncService({
    tenantId: 'tenant-alpha',
    vaultRoot: '/vault',
    ingestEvent: async () => ({ outcome: 'applied' }),
  });

  await assert.rejects(
    () => svc.handleChange('/vault/Paid_Media/doc.md', {
      metadata: {
        discipline: 'Paid_Media',
        audience: ['INVALID_TAG'],
        business_model: 'B2B',
        pain_point_tags: ['cac'],
      },
    }),
    { code: 'E_AUDIENCE_TAG_INVALID' }
  );
});
