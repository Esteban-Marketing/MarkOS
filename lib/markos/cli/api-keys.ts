// Phase 204 Plan 03 Task 1 — TypeScript twin export for API-key CRUD primitives.
//
// Runtime implementation lives in `api-keys.cjs`. This file is a type-only
// facade consumed by future TS tooling (204 Wave 3 doctrine-compliance surfaces
// + Phase 205 Bearer auth middleware). The .cjs module is the source of truth.
//
// Signatures MUST remain identical across both files (per 203-04 twin-export
// convention).

/* eslint-disable @typescript-eslint/no-var-requires */
// @ts-ignore — re-export runtime from CJS twin
const runtime = require('./api-keys.cjs');

export interface SupabaseLike {
  from(table: string): any;
  rpc?: (name: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
}

export interface MintKeyParams {
  client: SupabaseLike;
  tenant_id: string;
  user_id: string;
  name?: string | null;
  scope?: string;
}

export interface MintKeyResult {
  key_id: string;
  access_token: string;         // plaintext — ONLY returned here
  key_fingerprint: string;
  name: string | null;
  created_at: string;
}

export interface ListKeysParams {
  client: SupabaseLike;
  tenant_id: string;
}

export interface ApiKeyListEntry {
  id: string;
  name: string | null;
  key_fingerprint: string;
  scope: string;
  created_at: string;
  last_used_at: string | null;
}

export interface ListKeysResult {
  keys: ApiKeyListEntry[];
}

export interface RevokeKeyParams {
  client: SupabaseLike;
  tenant_id: string;
  user_id: string;
  key_id: string;
}

export interface RevokeKeyResult {
  revoked_at: string;
}

export interface ResolveKeyByHashParams {
  client: SupabaseLike;
  key_hash: string;
}

export interface ResolveKeyByHashResult {
  key_id: string;
  tenant_id: string;
  user_id: string;
  scope: string;
  revoked_at: string | null;
}

export declare function mintKey(params: MintKeyParams): Promise<MintKeyResult>;
export declare function listKeys(params: ListKeysParams): Promise<ListKeysResult>;
export declare function revokeKey(params: RevokeKeyParams): Promise<RevokeKeyResult>;
export declare function resolveKeyByHash(
  params: ResolveKeyByHashParams,
): Promise<ResolveKeyByHashResult | null>;

export declare const TABLE: 'markos_cli_api_keys';
export declare const KEY_PLAINTEXT_PREFIX: 'mks_ak_';
export declare const KEY_ID_PREFIX: 'cak_';
export declare const FINGERPRINT_LENGTH: 8;
export declare const LIST_COLUMNS: string;
export declare const RESOLVE_COLUMNS: string;
export declare function sha256Hex(text: string): string;

// Re-export runtime for CJS interop.
// @ts-ignore
module.exports = runtime;
