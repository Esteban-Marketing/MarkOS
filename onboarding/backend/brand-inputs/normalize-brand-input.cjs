'use strict';

/**
 * normalize-brand-input.cjs
 * 
 * Deterministic hybrid normalization pipeline for brand inputs (D-04).
 * 
 * Preserves minimal raw text references while creating canonical nodes and alias mappings.
 * Ensures identical inputs produce identical normalized outputs for replay-stable determinism.
 * 
 * Pipeline:
 * 1. Validate input schema
 * 2. Extract and preserve raw text sources
 * 3. Create canonical normalized nodes
 * 4. Generate alias mappings
 * 5. Attach fingerprints
 * 
 * Usage:
 *   const { normalizeBrandInput } = require('./normalize-brand-input.cjs');
 *   const result = normalizeBrandInput(tenantId, validatedInput);
 */

const {
  canonicalizePayload,
  generateFingerprint,
  buildTenantScopedKey,
  buildNormalizedNode,
} = require('./canonicalize-brand-node.cjs');

/**
 * Normalize a complete brand input into deterministic canonical form
 * while preserving minimal raw source references.
 * 
 * @param {string} tenantId - Tenant identifier from runtime context
 * @param {Object} brandInput - Validated brand input payload
 * @returns {Object} Normalized brand data with canonical nodes, aliases, and fingerprints
 * @throws {Error} If tenantId or input is invalid
 */
function normalizeBrandInput(tenantId, brandInput) {
  if (!tenantId) {
    throw new Error('normalizeBrandInput: tenantId is required');
  }

  if (!brandInput || typeof brandInput !== 'object') {
    throw new Error('normalizeBrandInput: invalid brandInput');
  }

  // Extract brand profile metadata
  const brandProfile = brandInput.brand_profile || {};
  const profileFingerprint = generateFingerprint(brandProfile);
  const profileKey = buildTenantScopedKey(tenantId, 'brand-profile', profileFingerprint);

  // Normalize audience segments
  const segments = brandInput.audience_segments || [];
  const normalizedSegments = [];
  const segmentAliases = new Map(); // Maps raw text to canonical segment IDs

  for (const segment of segments) {
    const normalized = buildNormalizedNode(tenantId, segment);

    // Track alias mappings for raw text -> canonical segment
    const rawKey = `${segment.segment_name}:${normalized.fingerprint}`;
    segmentAliases.set(rawKey, {
      canonical_id: normalized.segment_id,
      fingerprint: normalized.fingerprint,
      node_key: normalized.node_key,
    });

    normalizedSegments.push({
      ...normalized,
      raw_source: {
        segment_name: segment.segment_name,
        // Preserve only segment_id as minimal raw reference
        segment_id: segment.segment_id,
      },
    });
  }

  // Build normalized result
  const result = {
    metadata: {
      tenant_id: tenantId,
      normalization_version: '1.0',
      timestamp: new Date().toISOString(),
      input_fingerprint: generateFingerprint(brandInput),
    },
    brand_profile: {
      node_key: profileKey,
      tenant_id: tenantId,
      fingerprint: profileFingerprint,
      canonical: brandProfile,
      raw_source: {
        primary_name: brandProfile.primary_name,
        mission_statement: brandProfile.mission_statement,
      },
    },
    normalized_segments: normalizedSegments,
    segment_aliases: Array.from(segmentAliases.entries()).map(([rawKey, alias]) => ({
      raw_key: rawKey,
      ...alias,
    })),
    // Overall fingerprint for the normalized input
    content_fingerprint: generateFingerprint({
      brand_profile: brandProfile,
      segments: segments,
    }),
  };

  return result;
}

/**
 * Extract canonical node for a specific segment from normalized result.
 * Useful for downstream graph operations.
 * 
 * @param {Object} normalized - Result from normalizeBrandInput
 * @param {string} segmentId - Segment ID to extract
 * @returns {Object|null} Canonical node or null if not found
 */
function extractCanonicalSegmentNode(normalized, segmentId) {
  if (!normalized || !segmentId) {
    return null;
  }

  const segment = normalized.normalized_segments.find(s => s.segment_id === segmentId);
  return segment ? { ...segment } : null;
}

/**
 * Verify determinism: Normalize the same input twice and compare fingerprints.
 * Should produce identical fingerprints if determinism is preserved.
 * 
 * Used for testing and replay validation.
 * 
 * @param {string} tenantId - Tenant identifier
 * @param {Object} brandInput - Brand input payload
 * @returns {Object} { match: boolean, fp1: string, fp2: string }
 */
function verifyDeterminism(tenantId, brandInput) {
  const norm1 = normalizeBrandInput(tenantId, brandInput);
  const norm2 = normalizeBrandInput(tenantId, brandInput);

  return {
    match: norm1.content_fingerprint === norm2.content_fingerprint,
    fp1: norm1.content_fingerprint,
    fp2: norm2.content_fingerprint,
    segments_match: norm1.normalized_segments.every((seg, idx) => 
      seg.fingerprint === norm2.normalized_segments[idx]?.fingerprint
    ),
  };
}

module.exports = {
  normalizeBrandInput,
  extractCanonicalSegmentNode,
  verifyDeterminism,
};
