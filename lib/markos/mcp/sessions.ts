'use strict';
// Phase 202 Plan 01: Dual-export re-export stub (matches Phase 201 tenant/invites.ts convention).
// Source of truth lives in sessions.cjs; TypeScript callers import named exports via this stub.

const sess = require('./sessions.cjs');

export const ROLLING_TTL_MS: number = sess.ROLLING_TTL_MS;
export const hashToken = sess.hashToken as (opaque: string) => string;
export const createSession = sess.createSession as (client: unknown, input: {
  user_id: string;
  tenant_id: string;
  org_id: string;
  client_id: string;
  scopes?: string[];
  plan_tier?: string;
}) => Promise<{ session_id: string; opaque_token: string; expires_at: string }>;
export const lookupSession = sess.lookupSession as (client: unknown, bearer_token: string) => Promise<{
  id: string;
  user_id: string;
  tenant_id: string;
  org_id: string;
  client_id: string;
  scopes: string[];
  plan_tier: string;
  created_at: string;
  last_used_at: string;
  expires_at: string;
} | null>;
export const touchSession = sess.touchSession as (client: unknown, session_id: string) => Promise<void>;
export const revokeSession = sess.revokeSession as (client: unknown, input: { session_id: string; actor_id: string; reason?: string }) => Promise<void>;
export const listSessionsForTenant = sess.listSessionsForTenant as (client: unknown, tenant_id: string) => Promise<unknown[]>;
export const listSessionsForUser = sess.listSessionsForUser as (client: unknown, user_id: string) => Promise<unknown[]>;
