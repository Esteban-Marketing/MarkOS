'use strict';

/**
 * audit-store.cjs — Module-level in-memory audit entry store.
 *
 * Provides a singleton append-and-query store for audit lineage records created
 * during vault sync operations. Shared between sync-vault.cjs (via createAuditLog)
 * and server.cjs (for the visibility lineage endpoint) within the same process.
 *
 * Phase 85 scope: ingestion-adjacent audit only. Persistent storage (Supabase)
 * is deferred to Phase 86+ when the retrieval layer and role-view requirements land.
 */

const entries = [];

/**
 * Append a single audit entry to the in-memory store.
 *
 * @param {object} entry  Audit lineage record
 * @returns {object}       The stored entry (with appended_at timestamp)
 */
function append(entry) {
  const stored = { ...entry, appended_at: new Date().toISOString() };
  entries.push(stored);
  return stored;
}

/**
 * Retrieve all stored entries, optionally filtered by tenantId.
 *
 * @param {object} [filter]
 * @param {string} [filter.tenantId]  If provided, only entries matching this tenant are returned
 * @returns {object[]}
 */
function getAll(filter) {
  const tenantId = filter && typeof filter.tenantId === 'string' ? filter.tenantId.trim() : '';
  if (tenantId) {
    return entries.filter(
      (entry) => String((entry && entry.tenant_id) || '').trim() === tenantId
    );
  }

  return entries.slice();
}

/**
 * Return the total number of stored entries (for testing and diagnostics).
 *
 * @returns {number}
 */
function size() {
  return entries.length;
}

/**
 * Clear all entries (for testing only — not for production use).
 *
 * @returns {void}
 */
function clear() {
  entries.length = 0;
}

module.exports = {
  append,
  getAll,
  size,
  clear,
};
