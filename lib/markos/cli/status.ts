// Phase 204 Plan 08 Task 1 — TypeScript twin for status.cjs.
//
// Runtime source of truth is status.cjs. This file is a type-only facade — it
// re-exports the runtime so TypeScript consumers (Plan 205/207 middleware,
// future UI) can import typed signatures without duplicating the CJS module.

/* eslint-disable @typescript-eslint/no-var-requires */
// @ts-ignore — re-export runtime from CJS twin
const runtime = require('./status.cjs');

export type PlanTier = 'free' | 'pro' | 'enterprise' | string;
export type BillingStatus = 'active' | 'grace' | 'past_due' | 'canceled' | string;
export type RotationStage = 't-7' | 't-1' | 't-0' | 'normal' | string;

export interface SubscriptionPanel {
  plan_tier: PlanTier;
  billing_status: BillingStatus;
}

export interface QuotaPanel {
  runs_this_month: number;
  tokens_this_month: number;
  deliveries_this_month: number;
  window_days: number;
}

export interface ActiveRotationRow {
  id: string;
  subscription_id: string;
  url?: string | null;
  grace_ends_at: string;
  initiated_at?: string;
  stage: RotationStage;
}

export interface RecentRunRow {
  run_id: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  steps_completed: number;
  steps_total: number;
}

export interface StatusEnvelope {
  subscription: SubscriptionPanel;
  quota: QuotaPanel;
  active_rotations: ActiveRotationRow[];
  recent_runs: RecentRunRow[];
  generated_at: string;
}

export interface AggregateStatusParams {
  client: unknown;
  tenant_id: string;
  user_id?: string | null;
  recent_limit?: number;
}

export declare function aggregateStatus(params: AggregateStatusParams): Promise<StatusEnvelope>;
export declare function fetchSubscription(client: unknown, tenant_id: string): Promise<SubscriptionPanel>;
export declare function fetchQuota(client: unknown, tenant_id: string): Promise<QuotaPanel>;
export declare function fetchRotations(client: unknown, tenant_id: string): Promise<ActiveRotationRow[]>;
export declare function fetchRecentRuns(client: unknown, tenant_id: string, limit?: number): Promise<RecentRunRow[]>;

export declare const TENANTS_TABLE: 'markos_tenants';
export declare const ORGS_TABLE: 'markos_orgs';
export declare const RUNS_TABLE: 'markos_cli_runs';
export declare const QUOTA_WINDOW_DAYS: 30;
export declare const RECENT_RUNS_DEFAULT: 5;
export declare const DEFAULT_SUBSCRIPTION: Readonly<SubscriptionPanel>;

// @ts-ignore — re-export runtime for CJS interop.
module.exports = runtime;
