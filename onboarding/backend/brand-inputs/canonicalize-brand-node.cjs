'use strict';

/**
 * canonicalize-brand-node.cjs
 * 
 * Canonical serialization and SHA-256 fingerprinting for deterministic brand nodes (D-06).
 * 
 * Per RFC 8785-style canonicalization:
 * - Sort object keys alphabetically
 * - Remove all whitespace
 * - Ensure consistent ordering across runs
 * - Never include timestamps or runtime-only IDs in fingerprint material
 * 
 * Usage:
 *   const { canonicalizePayload, generateFingerprint } = require('./canonicalize-brand-node.cjs');
 */

const crypto = require('crypto');

/**
 * Recursively canonicalize an object by:
 * 1. Sorting all object keys alphabetically
 * 2. Converting arrays and primitives consistently
 * 3. Removing any whitespace variations
 * 
 * @param {*} obj - The object to canonicalize
 * @returns {*} Canonicalized object structure
 */
function canonicalizeObject(obj) {
  if (obj === null || obj === undefined) {
    return null;
  }

  // Primitives pass through
  if (typeof obj !== 'object') {
    return obj;
  }

  // Handle arrays: canonicalize each element
  if (Array.isArray(obj)) {
    return obj.map(item => canonicalizeObject(item));
  }

  // Handle objects: sort keys and canonicalize values
  const keys = Object.keys(obj).sort();
  const canonical = {};

  for (const key of keys) {
    canonical[key] = canonicalizeObject(obj[key]);
  }

  return canonical;
}

/**
 * Serialize a canonicalized object to JSON with no extra whitespace.
 * Produces deterministic output suitable for hashing.
 * 
 * @param {*} obj - The object to serialize
 * @returns {string} Compact JSON string
 */
function canonicalizePayload(obj) {
  const canonical = canonicalizeObject(obj);
  // JSON.stringify with no extras ensures no whitespace variations
  return JSON.stringify(canonical);
}

/**
 * Generate a stable SHA-256 fingerprint from deterministic fields only.
 * 
 * Excludes runtime metadata:
 * - created_at, updated_at, timestamps
 * - runtime_id, correlation_id, request_id
 * - Any volatile session or context fields
 * 
 * Includes only semantic content:
 * - Segment name, ID, text fields
 * - Pain points, needs, expectations, outcomes
 * - Brand profile information
 * 
 * @param {Object} payload - The payload to fingerprint
 * @returns {string} Lowercase hex SHA-256 hash
 */
function generateFingerprint(payload) {
  // Strip out runtime-only fields before fingerprinting
  const deterministicPayload = stripRuntimeFields(payload);
  const canonical = canonicalizePayload(deterministicPayload);
  return crypto
    .createHash('sha256')
    .update(canonical, 'utf8')
    .digest('hex');
}

/**
 * Remove runtime-only fields that should not affect node identity.
 * These fields vary across runs but don't represent semantic changes.
 * 
 * @param {Object} obj - The object to filter
 * @returns {Object} Copy with runtime fields removed
 */
function stripRuntimeFields(obj) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => stripRuntimeFields(item));
  }

  const filtered = {};
  
  for (const [key, value] of Object.entries(obj)) {
    // Skip runtime-only fields
    const isRuntimeField = [
      'created_at',
      'updated_at',
      'timestamp',
      'runtime_id',
      'correlation_id',
      'request_id',
      'session_id',
      'actor_id',
      'generated',
      '_ts',
      '_etag',
    ].includes(key);

    if (!isRuntimeField) {
      filtered[key] = stripRuntimeFields(value);
    }
  }

  return filtered;
}

/**
 * Generate a tenant-scoped composite identity key.
 * Format: tenant_id:segment_id:fingerprint
 * 
 * Ensures:
 * - Cross-tenant collisions are impossible
 * - Identical payloads in same tenant get same key
 * - Different tenants can have same segment without collision
 * 
 * @param {string} tenantId - Tenant identifier
 * @param {string} segmentId - Segment identifier
 * @param {string} fingerprint - Content fingerprint (from generateFingerprint)
 * @returns {string} Composite identity key
 * @throws {Error} If any required parameter is missing
 */
function buildTenantScopedKey(tenantId, segmentId, fingerprint) {
  if (!tenantId || !segmentId || !fingerprint) {
    throw new Error('buildTenantScopedKey: tenantId, segmentId, and fingerprint are required');
  }

  return `${tenantId}:${segmentId}:${fingerprint}`;
}

/**
 * Create a normalized evidence node from a segment.
 * Combines deterministic semantic content with tenant context.
 * 
 * @param {string} tenantId - Tenant identifier
 * @param {Object} segment - Audience segment from brand input
 * @returns {Object} Normalized evidence node with tenant scoping
 */
function buildNormalizedNode(tenantId, segment) {
  if (!tenantId || !segment || !segment.segment_id) {
    throw new Error('buildNormalizedNode: tenantId and segment with segment_id are required');
  }

  // Build deterministic node payload (excludes runtime fields)
  const nodePayload = {
    segment_id: segment.segment_id,
    segment_name: segment.segment_name,
    pains: (segment.pains || []).map(p => ({
      pain: p.pain,
      rationale: p.rationale
    })),
    needs: (segment.needs || []).map(n => ({
      need: n.need,
      rationale: n.rationale
    })),
    expectations: (segment.expectations || []).map(e => ({
      expectation: e.expectation,
      rationale: e.rationale
    })),
    desired_outcomes: segment.desired_outcomes || []
  };

  // Generate deterministic fingerprint
  const fingerprint = generateFingerprint(nodePayload);

  // Build tenant-scoped key
  const nodeKey = buildTenantScopedKey(tenantId, segment.segment_id, fingerprint);

  return {
    node_key: nodeKey,
    tenant_id: tenantId,
    segment_id: segment.segment_id,
    fingerprint,
    payload: nodePayload,
    canonical: canonicalizePayload(nodePayload)
  };
}

module.exports = {
  canonicalizeObject,
  canonicalizePayload,
  generateFingerprint,
  stripRuntimeFields,
  buildTenantScopedKey,
  buildNormalizedNode,
};
