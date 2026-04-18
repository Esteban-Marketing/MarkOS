'use strict';
// Phase 203 Plan 01 Task 1 — TypeScript dual-export stub (mirrors Phase 202 sessions.ts convention).
// Source of truth lives in store-supabase.cjs; TS callers import named exports via this stub.

const adapter = require('./store-supabase.cjs');

export type SubscriptionsStore = {
  insert: (row: any) => Promise<any>;
  updateActive: (tenant_id: string, id: string, active: boolean) => Promise<any | null>;
  listByTenant: (tenant_id: string) => Promise<any[]>;
  findById: (tenant_id: string, id: string) => Promise<any | null>;
};

export type DeliveriesStore = {
  insert: (row: any) => Promise<any>;
  findById: (id: string) => Promise<any | null>;
  update: (id: string, patch: Record<string, any>) => Promise<any | null>;
  listByTenant: (
    tenant_id: string,
    opts?: { status?: string; since?: string; limit?: number },
  ) => Promise<any[]>;
};

export const createSupabaseSubscriptionsStore =
  adapter.createSupabaseSubscriptionsStore as (client: any) => SubscriptionsStore;
export const createSupabaseDeliveriesStore =
  adapter.createSupabaseDeliveriesStore as (client: any) => DeliveriesStore;
