'use strict';
// Phase 202 Plan 04: Dual-export re-export stub.
// Source of truth lives in rate-limit.cjs; TypeScript callers import named exports via this stub.

const rl = require('./rate-limit.cjs');

export const SESSION_RPM: number = rl.SESSION_RPM;
export const TENANT_RPM: number = rl.TENANT_RPM;
export const checkRateLimit = rl.checkRateLimit as (
  redisOrLimiters: unknown,
  session: { id: string; tenant_id: string }
) => Promise<
  | { ok: true }
  | {
      ok: false;
      reason: 'session_rpm' | 'tenant_rpm';
      retry_after: number;
      scope: 'session' | 'tenant';
      limit: number;
      error_429: Error & { http: number; headers: Record<string, string>; body: Record<string, unknown> };
    }
>;
export const buildRateLimitedJsonRpcError = rl.buildRateLimitedJsonRpcError as (
  id: unknown,
  req_id: string,
  breach: { scope: string; retry_after: number; limit: number }
) => { jsonrpc: string; id: unknown; error: { code: number; message: string; data: Record<string, unknown> } };
