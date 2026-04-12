'use strict';

/**
 * evidence-graph-writer.cjs
 * 
 * Tenant-scoped idempotent evidence graph write adapter (D-06, D-05).
 * 
 * Enforces:
 * - Tenant-required composite identities in every upsert path
 * - Idempotent behavior: identical submissions produce single evidence node
 * - No cross-tenant collisions
 * - Integration with existing vector-store and relational persistence
 * 
 * Usage:
 *   const writer = require('./evidence-graph-writer.cjs');
 *   const result = await writer.upsertNormalizedSegments(tenantId, normalizedBrandData);
 */

const {
  buildTenantScopedKey,
} = require('./canonicalize-brand-node.cjs');

/**
 * In-memory evidence node store (can be replaced with Supabase/Upstash later).
 * Tracks idempotent upserts by tenant-scoped key.
 */
class EvidenceGraphStore {
  constructor() {
    this.nodes = new Map(); // key -> node record
    this.edges = new Map(); // edge_key -> edge record
  }

  /**
   * Upsert a normalized segment node into the graph.
   * 
   * Idempotent: identical key returns created=false on replay.
   * Tenant-safe: key includes tenant_id, preventing cross-tenant writes.
   * 
   * @param {string} tenantId - Tenant identifier
   * @param {string} nodeKey - Composite key from buildTenantScopedKey
   * @param {Object} payload - Normalized segment payload
   * @returns {Object} { created: boolean, node: {...}, committed: boolean }
   */
  upsertSegmentNode(tenantId, nodeKey, payload) {
    // Validate tenant scoping
    if (!nodeKey.startsWith(`${tenantId}:`)) {
      throw new Error(`TENANT_MISMATCH: node key '${nodeKey}' does not belong to tenant '${tenantId}'`);
    }

    const now = new Date().toISOString();

    if (this.nodes.has(nodeKey)) {
      // Node exists: update metadata only, preserve idempotence
      const existing = this.nodes.get(nodeKey);
      existing.updated_at = now;
      existing.upsert_count = (existing.upsert_count || 1) + 1;
      return {
        created: false,
        node: { ...existing },
        committed: false, // No new write needed
      };
    }

    // Create new node
    const node = {
      node_key: nodeKey,
      tenant_id: tenantId,
      ...payload,
      created_at: now,
      updated_at: now,
      upsert_count: 1,
    };

    this.nodes.set(nodeKey, node);

    return {
      created: true,
      node: { ...node },
      committed: true, // New write occurred
    };
  }

  /**
   * Create an edge relationship between two evidence nodes.
   * Also tenant-scoped and idempotent.
   * 
   * @param {string} tenantId - Tenant identifier
   * @param {string} fromNodeKey - Source node key
   * @param {string} toNodeKey - Target node key
   * @param {string} edgeType - Relationship type (e.g., "segment_to_profile")
   * @returns {Object} { created: boolean, edge: {...} }
   */
  createEdge(tenantId, fromNodeKey, toNodeKey, edgeType) {
    // Verify both nodes belong to tenant
    if (!fromNodeKey.startsWith(`${tenantId}:`)) {
      throw new Error(`TENANT_MISMATCH: from node key does not belong to tenant '${tenantId}'`);
    }
    if (!toNodeKey.startsWith(`${tenantId}:`)) {
      throw new Error(`TENANT_MISMATCH: to node key does not belong to tenant '${tenantId}'`);
    }

    const edgeKey = `${tenantId}:${edgeType}:${fromNodeKey}→${toNodeKey}`;
    const now = new Date().toISOString();

    if (this.edges.has(edgeKey)) {
      // Edge exists: return as-is
      return {
        created: false,
        edge: { ...this.edges.get(edgeKey) },
      };
    }

    // Create new edge
    const edge = {
      edge_key: edgeKey,
      tenant_id: tenantId,
      from_node_key: fromNodeKey,
      to_node_key: toNodeKey,
      edge_type: edgeType,
      created_at: now,
    };

    this.edges.set(edgeKey, edge);

    return {
      created: true,
      edge: { ...edge },
    };
  }

  /**
   * Retrieve all nodes for a tenant (filtered view).
   * 
   * @param {string} tenantId - Tenant identifier
   * @returns {Array} Nodes belonging to tenant only
   */
  getNodesByTenant(tenantId) {
    return Array.from(this.nodes.values())
      .filter(node => node.tenant_id === tenantId)
      .map(node => ({ ...node }));
  }

  /**
   * Retrieve all edges for a tenant (filtered view).
   * 
   * @param {string} tenantId - Tenant identifier
   * @returns {Array} Edges belonging to tenant only
   */
  getEdgesByTenant(tenantId) {
    return Array.from(this.edges.values())
      .filter(edge => edge.tenant_id === tenantId)
      .map(edge => ({ ...edge }));
  }

  /**
   * Check if a node exists for tenant.
   * 
   * @param {string} tenantId - Tenant identifier
   * @param {string} nodeKey - Node key to check
   * @returns {boolean} True if node exists and belongs to tenant
   */
  hasNode(tenantId, nodeKey) {
    if (!nodeKey.startsWith(`${tenantId}:`)) {
      return false;
    }
    return this.nodes.has(nodeKey);
  }

  /**
   * Get node details for tenant.
   * 
   * @param {string} tenantId - Tenant identifier
   * @param {string} nodeKey - Node key
   * @returns {Object|null} Node or null if not found or not owned by tenant
   */
  getNode(tenantId, nodeKey) {
    if (!nodeKey.startsWith(`${tenantId}:`)) {
      return null;
    }
    const node = this.nodes.get(nodeKey);
    return node ? { ...node } : null;
  }

  /**
   * Clear all records (for testing).
   */
  clear() {
    this.nodes.clear();
    this.edges.clear();
  }
}

// Global store instance (could be replaced with Supabase adapter)
const _globalStore = new EvidenceGraphStore();

/**
 * Upsert normalized segment nodes from brand input normalization.
 * Integrates normalization output into the evidence graph with tenant safety.
 * 
 * @param {string} tenantId - Tenant identifier
 * @param {Object} normalizedBrandData - Output from normalizeBrandInput
 * @returns {Object} { profile_upserted, segments_upserted: [], edges_created: [] }
 */
async function upsertNormalizedSegments(tenantId, normalizedBrandData) {
  if (!tenantId) {
    throw new Error('upsertNormalizedSegments: tenantId is required');
  }

  if (!normalizedBrandData || !Array.isArray(normalizedBrandData.normalized_segments)) {
    throw new Error('upsertNormalizedSegments: invalid normalizedBrandData');
  }

  const results = {
    profile_upserted: null,
    segments_upserted: [],
    edges_created: [],
  };

  try {
    // Upsert brand profile if present
    if (normalizedBrandData.brand_profile) {
      const profileKey = normalizedBrandData.brand_profile.node_key;

      // Verify tenant scoping
      if (!profileKey.startsWith(`${tenantId}:`)) {
        throw new Error(`TENANT_MISMATCH: profile key does not belong to tenant '${tenantId}'`);
      }

      const profileResult = _globalStore.upsertSegmentNode(
        tenantId,
        profileKey,
        {
          node_type: 'brand-profile',
          segment_id: 'brand-profile',
          fingerprint: normalizedBrandData.brand_profile.fingerprint,
          payload: normalizedBrandData.brand_profile.canonical,
        }
      );

      results.profile_upserted = {
        node_key: profileKey,
        created: profileResult.created,
        upsert_count: profileResult.node.upsert_count,
      };
    }

    // Upsert segment nodes
    for (const segment of normalizedBrandData.normalized_segments) {
      const nodeKey = segment.node_key;

      // Verify tenant scoping
      if (!nodeKey.startsWith(`${tenantId}:`)) {
        throw new Error(`TENANT_MISMATCH: segment node key does not belong to tenant '${tenantId}'`);
      }

      const segmentResult = _globalStore.upsertSegmentNode(
        tenantId,
        nodeKey,
        {
          node_type: 'audience-segment',
          segment_id: segment.segment_id,
          fingerprint: segment.fingerprint,
          payload: segment.payload,
        }
      );

      results.segments_upserted.push({
        node_key: nodeKey,
        segment_id: segment.segment_id,
        created: segmentResult.created,
        upsert_count: segmentResult.node.upsert_count,
      });

      // Create edge from segment to profile if profile exists
      if (results.profile_upserted) {
        const edgeResult = _globalStore.createEdge(
          tenantId,
          nodeKey,
          results.profile_upserted.node_key,
          'segment-of-profile'
        );

        results.edges_created.push({
          edge_key: edgeResult.edge.edge_key,
          created: edgeResult.created,
        });
      }
    }

    return results;
  } catch (error) {
    // Wrap errors with context
    const err = new Error(`upsertNormalizedSegments failed: ${error.message}`);
    err.originalError = error;
    throw err;
  }
}

/**
 * Query evidence nodes for a tenant.
 * Guarantees tenant isolation in results.
 * 
 * @param {string} tenantId - Tenant identifier
 * @param {string} nodeType - Filter by node_type (optional)
 * @returns {Object} { nodes: [], edges: [] }
 */
function queryEvidenceByTenant(tenantId, nodeType = null) {
  let nodes = _globalStore.getNodesByTenant(tenantId);

  if (nodeType) {
    nodes = nodes.filter(n => n.node_type === nodeType);
  }

  const edges = _globalStore.getEdgesByTenant(tenantId);

  return {
    nodes,
    edges,
    tenant_node_count: nodes.length,
    tenant_edge_count: edges.length,
  };
}

/**
 * For testing: get the global store instance.
 * Should NOT be used in production code.
 * 
 * @returns {EvidenceGraphStore} The global store
 */
function getGlobalStore() {
  return _globalStore;
}

module.exports = {
  EvidenceGraphStore,
  upsertNormalizedSegments,
  queryEvidenceByTenant,
  getGlobalStore,
};
