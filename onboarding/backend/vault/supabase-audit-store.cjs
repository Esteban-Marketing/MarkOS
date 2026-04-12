'use strict';

function normalizeTenantId(filter) {
  return filter && typeof filter.tenantId === 'string' ? filter.tenantId.trim() : '';
}

function createInMemoryAuditStore() {
  const entries = [];

  return {
    async append(entry) {
      const stored = { ...entry, appended_at: new Date().toISOString() };
      entries.push(stored);
      return stored;
    },

    async getAll(filter) {
      const tenantId = normalizeTenantId(filter);
      if (tenantId) {
        return entries.filter(
          (item) => String((item && item.tenant_id) || '').trim() === tenantId
        );
      }
      return entries.slice();
    },

    async size() {
      return entries.length;
    },

    async clear(filter) {
      const tenantId = normalizeTenantId(filter);
      if (!tenantId) {
        entries.length = 0;
        return;
      }

      const keep = entries.filter((item) => String((item && item.tenant_id) || '').trim() !== tenantId);
      entries.length = 0;
      entries.push(...keep);
    },
  };
}

function createSupabaseAuditStore(options = {}) {
  const supabase = options.supabase;
  const tableName = String(options.tableName || 'audit_lineage').trim();

  if (!supabase || typeof supabase.from !== 'function') {
    const error = new Error('Supabase client is required for createSupabaseAuditStore.');
    error.code = 'E_AUDIT_SUPABASE_REQUIRED';
    throw error;
  }

  return {
    async append(entry) {
      const payload = { ...entry, appended_at: new Date().toISOString() };
      const query = supabase.from(tableName);
      const result = await query.insert(payload);
      if (result && result.error) {
        const error = new Error(result.error.message || 'Failed to append audit entry.');
        error.code = 'E_AUDIT_APPEND_FAILED';
        throw error;
      }
      return payload;
    },

    async getAll(filter) {
      const tenantId = normalizeTenantId(filter);
      let query = supabase.from(tableName);
      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      const result = await query.select('*');
      if (result && result.error) {
        const error = new Error(result.error.message || 'Failed to read audit entries.');
        error.code = 'E_AUDIT_READ_FAILED';
        throw error;
      }

      return Array.isArray(result && result.data) ? result.data : [];
    },

    async size() {
      const all = await this.getAll();
      return all.length;
    },

    async clear(filter) {
      const tenantId = normalizeTenantId(filter);
      let query = supabase.from(tableName);
      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      const result = await query.delete();
      if (result && result.error) {
        const error = new Error(result.error.message || 'Failed to clear audit entries.');
        error.code = 'E_AUDIT_CLEAR_FAILED';
        throw error;
      }
    },
  };
}

module.exports = {
  createInMemoryAuditStore,
  createSupabaseAuditStore,
};
