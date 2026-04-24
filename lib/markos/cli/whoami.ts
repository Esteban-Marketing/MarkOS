// Phase 204 Plan 04 Task 1 — TypeScript twin export for resolveWhoami.
//
// Runtime implementation lives in `whoami.cjs`. This file is a type-only
// facade consumed by future TS tooling + Phase 205 Bearer auth middleware.
// The .cjs module is the source of truth. Signatures MUST remain identical.

/* eslint-disable @typescript-eslint/no-var-requires */
// @ts-ignore — re-export runtime from CJS twin
const runtime = require('./whoami.cjs');

export interface SupabaseLike {
  from(table: string): any;
  rpc?: (name: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
}

export interface ResolveWhoamiParams {
  client: SupabaseLike;
  key_hash: string;
}

export interface ResolveSessionWhoamiParams {
  client: SupabaseLike;
  user_id: string;
  tenant_id: string;
}

export interface WhoamiEnvelope {
  tenant_id: string;
  tenant_name: string;
  role: 'owner' | 'admin' | 'member' | 'readonly' | string;
  email: string;
  user_id: string;
  key_fingerprint: string | null;
  scope: string;
  last_used_at: string | null;
}

export declare function resolveWhoami(params: ResolveWhoamiParams): Promise<WhoamiEnvelope>;
export declare function resolveSessionWhoami(
  params: ResolveSessionWhoamiParams,
): Promise<WhoamiEnvelope>;

export declare const TENANTS_TABLE: 'markos_tenants';
export declare const USERS_TABLE: 'markos_users';
export declare const MEMBERSHIPS_TABLE: 'markos_tenant_memberships';
export declare const API_KEYS_TABLE: 'markos_cli_api_keys';

// Re-export runtime for CJS interop.
// @ts-ignore
module.exports = runtime;
