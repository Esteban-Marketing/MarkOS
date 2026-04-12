const test = require('node:test');
const assert = require('node:assert/strict');

const {
  normalizeRetrievalEnvelope,
} = require('../../onboarding/backend/pageindex/retrieval-envelope.cjs');

test('84-02 retrieval envelope parses and normalizes deterministically', () => {
  const envelope = normalizeRetrievalEnvelope({
    mode: 'reason',
    discipline: '  Paid Media ',
    audience: ' operators ',
    filters: {
      pain_point_tags: ['high_cpr', 'high_cpr', 'low_ltv'],
      business_model: ['B2B', 'B2B'],
      funnel_stage: ['decision', 'awareness'],
      content_type: ['playbook', 'playbook'],
      tenant_scope: 'tenant-a',
    },
    provenance_required: true,
  });

  assert.deepEqual(envelope, {
    mode: 'reason',
    discipline: 'Paid Media',
    audience: 'operators',
    filters: {
      pain_point_tags: ['high_cpr', 'low_ltv'],
      business_model: ['B2B'],
      funnel_stage: ['awareness', 'decision'],
      content_type: ['playbook'],
      tenant_scope: 'tenant-a',
    },
    provenance_required: true,
  });
});

test('84-02 retrieval envelope rejects unknown keys and missing provenance_required true', () => {
  assert.throws(() => {
    normalizeRetrievalEnvelope({
      mode: 'reason',
      discipline: 'Paid Media',
      audience: 'operators',
      filters: {
        pain_point_tags: [],
        business_model: [],
        funnel_stage: [],
        content_type: [],
        tenant_scope: 'tenant-a',
      },
      provenance_required: true,
      unknown_field: 'nope',
    });
  }, (error) => error && error.code === 'E_RETRIEVAL_ENVELOPE_UNKNOWN_KEY');

  assert.throws(() => {
    normalizeRetrievalEnvelope({
      mode: 'reason',
      discipline: 'Paid Media',
      audience: 'operators',
      filters: {
        pain_point_tags: [],
        business_model: [],
        funnel_stage: [],
        content_type: [],
        tenant_scope: 'tenant-a',
      },
      provenance_required: false,
    });
  }, (error) => error && error.code === 'E_RETRIEVAL_ENVELOPE_PROVENANCE_REQUIRED');
});

test('84-02 retrieval envelope shape is single contract for reason apply iterate modes', () => {
  const modes = ['reason', 'apply', 'iterate'];

  for (const mode of modes) {
    const envelope = normalizeRetrievalEnvelope({
      mode,
      discipline: null,
      audience: null,
      filters: {
        pain_point_tags: [],
        business_model: [],
        funnel_stage: [],
        content_type: [],
        tenant_scope: 'tenant-a',
      },
      provenance_required: true,
    });

    assert.deepEqual(Object.keys(envelope), [
      'mode',
      'discipline',
      'audience',
      'filters',
      'provenance_required',
    ]);
  }
});
