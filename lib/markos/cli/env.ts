// Phase 204 Plan 07 Task 1 — TypeScript twin for env.cjs.
//
// Runtime source of truth is env.cjs. This file is a type-only facade — it
// re-exports the runtime so TypeScript consumers (Plan 205/207 middleware,
// future UI, doctrine-compliance work in 204-13) can import typed signatures
// without duplicating the CJS module.

/* eslint-disable @typescript-eslint/no-var-requires */
// @ts-ignore — re-export runtime from CJS twin
const runtime = require('./env.cjs');

export interface SupabaseLike {
  from(table: string): any;
  rpc?: (name: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
}

export interface EnvListEntry {
  key: string;
  value_preview: string;
  updated_at: string;
  updated_by: string;
}

export interface EnvEntry {
  key: string;
  value: string;
}

export interface ListEnvParams {
  client: SupabaseLike;
  tenant_id: string;
}

export interface PullEnvParams {
  client: SupabaseLike;
  tenant_id: string;
  encryption_key: string;
}

export interface PushEnvParams {
  client: SupabaseLike;
  tenant_id: string;
  user_id: string;
  entries: EnvEntry[];
  encryption_key: string;
}

export interface DeleteEnvParams {
  client: SupabaseLike;
  tenant_id: string;
  user_id: string;
  keys: string[];
}

export interface DotenvParseError {
  line: number;
  key?: string;
  reason: string;
  raw?: string;
}

export interface DotenvParseResult {
  ok: boolean;
  entries: EnvEntry[];
  errors: DotenvParseError[];
}

export declare function listEnv(params: ListEnvParams): Promise<EnvListEntry[]>;
export declare function pullEnv(params: PullEnvParams): Promise<EnvEntry[]>;
export declare function pushEnv(params: PushEnvParams): Promise<{ updated: number }>;
export declare function deleteEnv(params: DeleteEnvParams): Promise<{ deleted: number }>;
export declare function parseDotenv(text: string): DotenvParseResult;
export declare function serializeDotenv(entries: EnvEntry[]): string;

export declare const TABLE: 'markos_cli_tenant_env';
export declare const LIST_COLUMNS: string;
export declare const DOTENV_KEY_RE: RegExp;

// Re-export runtime for CJS interop.
// @ts-ignore
module.exports = runtime;
