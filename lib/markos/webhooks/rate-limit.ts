'use strict';
// Phase 203 Plan 07 — Per-subscription webhook rate-limit (D-13).
// Source of truth lives in rate-limit.cjs; TypeScript callers import named exports via this stub.

const rl = require('./rate-limit.cjs');

export const PLAN_TIER_RPS: Readonly<{ free: number; team: number; enterprise: number }> = rl.PLAN_TIER_RPS;

export type PlanTier = 'free' | 'team' | 'enterprise';

export const resolvePerSubRps = rl.resolvePerSubRps as (input: {
  plan_tier: string;
  rps_override?: number | null;
}) => number;

export type WebhookRateLimitOk = { ok: true; limit: number; remaining?: number };
export type WebhookRateLimitBreach = {
  ok: false;
  reason: 'sub_rps';
  retry_after: number;
  limit: number;
  error_429: Error & {
    http: number;
    headers: Record<string, string>;
    body: { error: string; sub_id: string; retry_after: number; limit: number };
  };
};

export const checkWebhookRateLimit = rl.checkWebhookRateLimit as (
  redisOrLimiter: unknown,
  input: {
    subscription: { id: string; rps_override?: number | null };
    plan_tier: string;
  },
) => Promise<WebhookRateLimitOk | WebhookRateLimitBreach>;

export const buildRateLimitedEnvelope = rl.buildRateLimitedEnvelope as (input: {
  retry_after: number;
  limit: number;
  sub_id: string;
}) => {
  http: number;
  headers: Record<string, string>;
  body: { error: string; sub_id: string; retry_after: number; limit: number };
};
