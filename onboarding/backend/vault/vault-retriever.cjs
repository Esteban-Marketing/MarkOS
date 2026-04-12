'use strict';

const { checkRetrievalScope, projectAuditLineage } = require('./visibility-scope.cjs');
const { applyFilter } = require('./retrieval-filter.cjs');
const { buildHandoffPack } = require('./handoff-pack.cjs');

function createError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function asFunction(value, code, message) {
  if (typeof value !== 'function') {
    throw createError(code, message);
  }
  return value;
}

/**
 * Create a vault retriever factory that retrieves artifacts in three modes:
 * - reason: raw content for LLM reasoning
 * - apply: template context for execution
 * - iterate: verification hooks for outcome verification
 *
 * @param {object} options
 * @param {function} [options.getArtifacts] Injected artifact reader (default: audit-store.getAll)
 * @returns {object} Retriever with three mode methods
 */
function createVaultRetriever(options = {}) {
  const getArtifacts = asFunction(
    options.getArtifacts,
    'E_VAULT_RETRIEVER_ARTIFACTS_REQUIRED',
    'getArtifacts() is required.'
  );

  /**
   * Internal retrieve pipeline: scope check → tenant filter → apply filter → pack
   */
  async function retrieve({ mode, claims, resourceContext, filter }) {
    // Step 1: Check retrieval scope (fails closed on invalid role/tenant)
    const scopeCheck = checkRetrievalScope(claims, resourceContext);
    if (!scopeCheck.allowed) {
      throw createError(scopeCheck.code, scopeCheck.reason);
    }

    // Step 2: Get all artifacts and project to caller's tenant
    const allArtifacts = await getArtifacts();
    const tenantFiltered = projectAuditLineage(claims, allArtifacts);

    // Step 3: Apply discipline + audience_tags filter
    const filtered = applyFilter(tenantFiltered, filter || {});

    // Step 4: Build handoff packs for each artifact
    const packs = filtered.map((artifact) =>
      buildHandoffPack({
        mode,
        artifact,
        audienceContext: { filter_applied: filter },
        claims,
      })
    );

    return packs;
  }

  return {
    /**
     * Retrieve artifacts in 'reason' mode: raw content for LLM reasoning
     */
    async retrieveReason({ tenantId, claims, filter }) {
      return retrieve({
        mode: 'reason',
        claims,
        resourceContext: { tenantId },
        filter,
      });
    },

    /**
     * Retrieve artifacts in 'apply' mode: template context for execution
     */
    async retrieveApply({ tenantId, claims, filter }) {
      return retrieve({
        mode: 'apply',
        claims,
        resourceContext: { tenantId },
        filter,
      });
    },

    /**
     * Retrieve artifacts in 'iterate' mode: verification hooks for outcome loops
     */
    async retrieveIterate({ tenantId, claims, filter }) {
      return retrieve({
        mode: 'iterate',
        claims,
        resourceContext: { tenantId },
        filter,
      });
    },
  };
}

module.exports = {
  createVaultRetriever,
};
