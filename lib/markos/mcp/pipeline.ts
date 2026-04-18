'use strict';
// Phase 202 Plan 04: Dual-export re-export stub.
const p = require('./pipeline.cjs');

export const STEP_NAMES: readonly string[] = p.STEP_NAMES;
export const TIMEOUT_MS: Readonly<{ simple: number; llm: number; long: number }> = p.TIMEOUT_MS;
export const runToolCall = p.runToolCall as (deps: {
  supabase: unknown;
  redis: unknown;
  bearer_token: string;
  tool_name: string;
  args: Record<string, unknown>;
  id: unknown;
  _meta?: { progressToken?: string };
  toolRegistry?: Record<string, unknown>;
}) => Promise<
  | { ok: true; result: unknown; req_id: string; cost_cents: number }
  | { ok: false; jsonRpcError: unknown; httpStatus?: number; headers?: Record<string, string>; req_id: string }
>;
