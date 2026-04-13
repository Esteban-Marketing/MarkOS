'use strict';

function createDeterministicAuditStore(seed = []) {
  const rows = Array.isArray(seed) ? seed.map((item) => ({ ...item })) : [];

  return {
    rows,
    async append(entry) {
      const stored = {
        ...entry,
        appended_at: `mock-${String(rows.length + 1).padStart(3, '0')}`,
      };
      rows.push(stored);
      return stored;
    },
    async getAll(filter) {
      const tenantId = String((filter && filter.tenantId) || '').trim();
      if (!tenantId) {
        return rows.map((item) => ({ ...item }));
      }
      return rows
        .filter((item) => String((item && item.tenant_id) || '').trim() === tenantId)
        .map((item) => ({ ...item }));
    },
  };
}

module.exports = {
  createDeterministicAuditStore,
};
