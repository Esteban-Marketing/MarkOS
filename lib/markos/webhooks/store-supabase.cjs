'use strict';

// Phase 203 Plan 01 Task 1 — Supabase-backed subscription + delivery adapters.
// Source: 203-RESEARCH.md §Code Examples lines 631-719 (shape-verbatim).
//
// T-203-01-02 mitigation: every cross-tenant query uses `.eq('tenant_id', tenant_id)` FIRST.
// Error messages are prefixed with `store-supabase.<method>:` for telemetry grep (matches 202 pattern).

function createSupabaseSubscriptionsStore(client) {
  return {
    async insert(row) {
      const { data, error } = await client
        .from('markos_webhook_subscriptions')
        .insert(row)
        .select()
        .single();
      if (error) throw new Error(`store-supabase.insert: ${error.message}`);
      return data;
    },
    async updateActive(tenant_id, id, active) {
      const { data, error } = await client
        .from('markos_webhook_subscriptions')
        .update({ active, updated_at: new Date().toISOString() })
        .eq('tenant_id', tenant_id) // CRITICAL — tenant scope FIRST (cross-tenant guard)
        .eq('id', id)
        .select()
        .maybeSingle();
      if (error) throw new Error(`store-supabase.updateActive: ${error.message}`);
      return data || null;
    },
    async listByTenant(tenant_id) {
      const { data, error } = await client
        .from('markos_webhook_subscriptions')
        .select('*')
        .eq('tenant_id', tenant_id)
        .eq('active', true);
      if (error) throw new Error(`store-supabase.listByTenant: ${error.message}`);
      return data || [];
    },
    async findById(tenant_id, id) {
      const { data, error } = await client
        .from('markos_webhook_subscriptions')
        .select('*')
        .eq('tenant_id', tenant_id) // tenant-first
        .eq('id', id)
        .maybeSingle();
      if (error) throw new Error(`store-supabase.findById: ${error.message}`);
      return data || null;
    },
  };
}

function createSupabaseDeliveriesStore(client) {
  return {
    async insert(row) {
      const { data, error } = await client
        .from('markos_webhook_deliveries')
        .insert(row)
        .select()
        .single();
      if (error) throw new Error(`store-supabase.deliveries.insert: ${error.message}`);
      return data;
    },
    async findById(id) {
      const { data, error } = await client
        .from('markos_webhook_deliveries')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw new Error(`store-supabase.deliveries.findById: ${error.message}`);
      return data || null;
    },
    async update(id, patch) {
      const { data, error } = await client
        .from('markos_webhook_deliveries')
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .maybeSingle();
      if (error) throw new Error(`store-supabase.deliveries.update: ${error.message}`);
      return data || null;
    },
    async listByTenant(tenant_id, { status, since, limit = 100 } = {}) {
      let q = client
        .from('markos_webhook_deliveries')
        .select('*')
        .eq('tenant_id', tenant_id)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (status) q = q.eq('status', status);
      if (since) q = q.gte('created_at', since);
      const { data, error } = await q;
      if (error) throw new Error(`store-supabase.deliveries.listByTenant: ${error.message}`);
      return data || [];
    },
  };
}

module.exports = {
  createSupabaseSubscriptionsStore,
  createSupabaseDeliveriesStore,
};
