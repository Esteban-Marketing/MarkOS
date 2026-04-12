'use strict';

const { normalizeProvenance } = require('./provenance-contract.cjs');

const SCHEMA_HINTS = {
  reason: 'raw-artifact-for-llm',
  apply: 'pre-filled-template',
  iterate: 'outcome-verification-loop',
};

const VALID_MODES = new Set(['reason', 'apply', 'iterate']);

function normalizeToken(value) {
  return String(value || '').trim();
}

function createError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

/**
 * Build a deterministic execution handoff payload for a vault artifact in one of three retrieval modes.
 *
 * @param {object} options
 * @param {string} options.mode             'reason' | 'apply' | 'iterate'
 * @param {object} options.artifact         Audit-store entry (tenant_id, doc_id, content_hash, observed_at, ...)
 * @param {object} [options.audienceContext] Filter context that produced this result
 * @param {object} [options.claims]          Caller claims (tenantId, role)
 * @returns {object} Deterministic handoff pack
 */
function buildHandoffPack({ mode, artifact, audienceContext = {}, claims = {} }) {
  if (!VALID_MODES.has(mode)) {
    throw createError('E_HANDOFF_INVALID_MODE', `mode must be one of: ${[...VALID_MODES].join(', ')}`);
  }

  if (!artifact || typeof artifact !== 'object') {
    throw createError('E_HANDOFF_ARTIFACT_REQUIRED', 'artifact is required and must be an object.');
  }

  const tenantId = normalizeToken(artifact.tenant_id);
  const docId = normalizeToken(artifact.doc_id);
  const contentHash = normalizeToken(artifact.content_hash);

  const idempotencyKey = `retrieve:${tenantId}:${docId}:${mode}:${contentHash}`;

  const provenance = normalizeProvenance(artifact.provenance || {}, {
    sourceSystem: 'vault-retriever',
    sourceKind: mode,
  });

  const baseResult = {
    mode,
    artifact_id: docId,
    discipline: artifact.discipline || null,
    audience_context: audienceContext || null,
    provenance,
    idempotency_key: idempotencyKey,
    retrieved_at: artifact.observed_at || artifact.appended_at || new Date(),
    reasoning_context: {
      filter_applied: audienceContext?.filter_applied || null,
      retrieval_mode: mode,
      schema_hint: SCHEMA_HINTS[mode],
    },
    evidence_links: [
      {
        artifact_id: docId,
        audit_idempotency_key: artifact.idempotency_key || null,
        provenance_summary: {
          system: provenance.source.system,
          kind: provenance.source.kind,
          timestamp: provenance.timestamp,
        },
      },
    ],
  };

  // Apply mode-specific fields
  if (mode === 'reason') {
    baseResult.raw_content = artifact.content || null;
  } else if (mode === 'apply') {
    baseResult.template_context = {
      discipline: artifact.discipline || null,
      audience: artifact.audience || [],
      pain_point_tags: artifact.pain_point_tags || [],
      business_model: artifact.business_model || null,
    };
  } else if (mode === 'iterate') {
    baseResult.verification_hook = {
      expected_outcome_pattern: null,
      evidence_artifact_id: docId,
      comparison_fields: ['discipline', 'audience', 'pain_point_tags'],
    };
  }

  return baseResult;
}

module.exports = {
  buildHandoffPack,
};
