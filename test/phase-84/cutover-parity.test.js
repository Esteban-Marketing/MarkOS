const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createPageIndexAdapter,
} = require('../../onboarding/backend/pageindex/pageindex-client.cjs');

function buildEnvelope(mode) {
  return {
    mode,
    discipline: 'Paid Media',
    audience: 'operators',
    filters: {
      pain_point_tags: ['high_cpr'],
      business_model: ['B2B'],
      funnel_stage: ['awareness'],
      content_type: ['playbook'],
      tenant_scope: 'tenant-a',
    },
    provenance_required: true,
  };
}

function createAdapter() {
  return createPageIndexAdapter({
    resolveDocIds: async () => ['chunk-1', 'chunk-2'],
    retrieveDocuments: async () => ([
      {
        id: 'chunk-1',
        text: 'Reason/apply/iterate stable contract payload',
        score: 0.93,
        metadata: { scope: 'tenant-a', lane: 'parity' },
        provenance: {
          source: { system: 'pageindex', kind: 'retrieval' },
          timestamp: '2026-04-12T00:00:00.000Z',
          actor: { id: 'tenant-a', type: 'system' },
          lineage: ['pageindex', 'retrieval'],
          joins: { audience: ['operators'], pain_point_tags: ['high_cpr'] },
        },
      },
      {
        id: 'chunk-2',
        text: 'Second payload keeps deterministic ordering and shape',
        score: 0.74,
        metadata: { scope: 'tenant-a', lane: 'parity' },
        provenance: {
          source: { system: 'pageindex', kind: 'retrieval' },
          timestamp: '2026-04-12T00:00:00.000Z',
          actor: { id: 'tenant-a', type: 'system' },
          lineage: ['pageindex', 'retrieval'],
          joins: { audience: ['operators'], pain_point_tags: ['high_cpr'] },
        },
      },
    ]),
  });
}

test('84-03 parity gate keeps one deterministic retrieval contract across reason/apply/iterate', async () => {
  const adapter = createAdapter();
  const modes = ['reason', 'apply', 'iterate'];

  const snapshots = [];
  for (const mode of modes) {
    const result = await adapter.retrieve({
      tenantId: 'tenant-a',
      envelope: buildEnvelope(mode),
    });

    snapshots.push({
      keys: Object.keys(result),
      doc_ids: result.doc_ids,
      item_shape: result.items.map((item) => Object.keys(item)),
      provenance_source: result.items.map((item) => item.provenance.source.system),
    });
  }

  assert.deepEqual(snapshots[0].keys, snapshots[1].keys);
  assert.deepEqual(snapshots[1].keys, snapshots[2].keys);
  assert.deepEqual(snapshots[0].doc_ids, snapshots[1].doc_ids);
  assert.deepEqual(snapshots[1].doc_ids, snapshots[2].doc_ids);
  assert.deepEqual(snapshots[0].item_shape, snapshots[1].item_shape);
  assert.deepEqual(snapshots[1].item_shape, snapshots[2].item_shape);
  assert.deepEqual(snapshots[0].provenance_source, ['pageindex', 'pageindex']);
});
