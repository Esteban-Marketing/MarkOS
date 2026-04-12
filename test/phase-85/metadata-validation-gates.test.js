const test = require('node:test');
const assert = require('node:assert/strict');

const { createIngestRouter } = require('../../onboarding/backend/vault/ingest-router.cjs');

function validMetadata() {
  return {
    discipline: 'Paid_Media',
    audience: ['ICP:SMB', 'ROLE:Founder'],
    business_model: 'B2B',
    pain_point_tags: ['high_cac'],
  };
}

test('85-01 metadata gate requires mandatory fields before ingest dispatch', async () => {
  const router = createIngestRouter({
    persistArtifact: async () => ({ ok: true }),
    indexArtifact: async () => ({ ok: true }),
  });

  await assert.rejects(
    () => router.route({
      event: {
        tenant_id: 'tenant-alpha',
        doc_id: 'paid-media/doc.md',
        event_type: 'change',
        source_path: '/vault/Paid_Media/doc.md',
        metadata: { audience: ['ICP:SMB'] },
      },
    }),
    (error) => error && error.code === 'E_AUDIENCE_METADATA_REQUIRED'
  );
});

test('85-01 metadata gate rejects audience tags outside allowed schema with explicit code', async () => {
  const router = createIngestRouter({
    persistArtifact: async () => ({ ok: true }),
    indexArtifact: async () => ({ ok: true }),
  });

  await assert.rejects(
    () => router.route({
      event: {
        tenant_id: 'tenant-alpha',
        doc_id: 'paid-media/doc.md',
        event_type: 'change',
        source_path: '/vault/Paid_Media/doc.md',
        metadata: {
          ...validMetadata(),
          audience: ['NOT_A_REAL_TAG'],
        },
      },
    }),
    (error) => error && error.code === 'E_AUDIENCE_TAG_INVALID'
  );
});

test('85-01 rejected metadata never calls writer/index persistence clients', async () => {
  let persistCalls = 0;
  let indexCalls = 0;

  const router = createIngestRouter({
    persistArtifact: async () => {
      persistCalls += 1;
      return { ok: true };
    },
    indexArtifact: async () => {
      indexCalls += 1;
      return { ok: true };
    },
  });

  await assert.rejects(
    () => router.route({
      event: {
        tenant_id: 'tenant-alpha',
        doc_id: 'paid-media/doc.md',
        event_type: 'change',
        source_path: '/vault/Paid_Media/doc.md',
        metadata: {
          discipline: 'Paid_Media',
          audience: [],
          business_model: 'B2B',
          pain_point_tags: ['high_cac'],
        },
      },
    }),
    (error) => error && error.code === 'E_AUDIENCE_TAG_INVALID'
  );

  assert.equal(persistCalls, 0);
  assert.equal(indexCalls, 0);
});
