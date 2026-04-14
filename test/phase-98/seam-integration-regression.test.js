const test = require('node:test');
const assert = require('node:assert/strict');

const { resolveTemplateSelection } = require('../../onboarding/backend/agents/example-resolver.cjs');
const { searchApprovedKnowledge } = require('../../onboarding/backend/research/company-knowledge-service.cjs');
const { normalizeRetrievalEnvelope, mergeReasoningRetrievalFilters } = require('../../onboarding/backend/pageindex/retrieval-envelope.cjs');

test('98-03 resolver honors a winner overlay while preserving the fallback path', () => {
  const fallback = resolveTemplateSelection('Paid_Media', 'B2B');
  const assisted = resolveTemplateSelection('Paid_Media', 'B2B', {
    reasoning: {
      winner: {
        overlay_key: 'saas',
        retrieval_filters: { tenant_scope: 'tenant-alpha-001', neuro_trigger_tags: ['B04'] },
      },
    },
  });

  assert.equal(fallback.overlayDoc, null);
  assert.match(assisted.overlayDoc || '', /overlay-saas/i);
});

test('98-03 retrieval seam keeps tenant scope and provenance required when winner filters are merged', () => {
  const mergedFilters = mergeReasoningRetrievalFilters(
    { tenant_scope: 'tenant-alpha-001', content_type: ['tactic'] },
    {
      winner: {
        primary_trigger: 'B04',
        retrieval_filters: {
          tenant_scope: 'tenant-alpha-001',
          trust_driver_tags: ['proof'],
          icp_segment_tags: ['revops_leader'],
          neuro_trigger_tags: ['B04'],
        },
      },
    }
  );

  const envelope = normalizeRetrievalEnvelope({
    mode: 'reason',
    discipline: 'Paid Media',
    filters: mergedFilters,
    provenance_required: true,
  });

  assert.equal(envelope.provenance_required, true);
  assert.equal(envelope.filters.tenant_scope, 'tenant-alpha-001');
  assert.deepEqual(envelope.filters.trust_driver_tags, ['proof']);
  assert.deepEqual(envelope.filters.icp_segment_tags, ['revops_leader']);
  assert.deepEqual(envelope.filters.neuro_trigger_tags, ['B04']);
});

test('98-03 approved knowledge search can surface concise reasoning metadata without widening scope', async () => {
  const response = await searchApprovedKnowledge({
    query: 'operator trust',
    scopes: ['literacy'],
    claims: { tenantId: 'tenant-alpha-001' },
    filters: { tenant_scope: 'tenant-alpha-001' },
    reasoning: {
      winner: {
        overlay_key: 'saas',
        confidence: 'medium',
        retrieval_filters: {
          tenant_scope: 'tenant-alpha-001',
          trust_driver_tags: ['proof'],
        },
        why_it_fits_summary: 'Proof-led trust cues fit the current ICP.',
      },
    },
    fixtures: {
      records: [
        {
          tenant_id: 'tenant-alpha-001',
          kind: 'literacy',
          artifact_id: 'lit-001',
          title: 'RevOps proof brief',
          content: 'Proof and traceability improve operator trust.',
          source_ref: 'Literacy / RevOps / Canonical',
          approval_status: 'approved',
          score: 0.9,
          confidence: 0.9,
          implication: 'Lead with diagnostic proof.',
        },
      ],
    },
  });

  assert.equal(response.results.length, 1);
  assert.equal(response.reasoning.winner.overlay_key, 'saas');
  assert.equal(response.reasoning.confidence, 'medium');
});
