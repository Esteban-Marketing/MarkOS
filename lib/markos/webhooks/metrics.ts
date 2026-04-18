// Phase 203 Plan 09 Task 1 — Webhook fleet + per-subscription metrics aggregator (TS surface).
// Dual-export parity with metrics.cjs; see that file for documentation.

export interface FleetMetrics {
  tenant_id: string;
  total_24h: number;
  success_rate: number;
  avg_latency_ms: number;
  dlq_count: number;
  window_start: string;
  window_end: string;
}

export interface PerSubMetrics {
  total_24h: number;
  success_rate: number;
  avg_latency_ms: number;
  last_delivery_at: string | null;
}

export declare function aggregateFleetMetrics(
  client: unknown,
  tenant_id: string,
  now?: Date,
): Promise<FleetMetrics>;

export declare function perSubMetrics(
  client: unknown,
  tenant_id: string,
  subscription_id: string,
  now?: Date,
): Promise<PerSubMetrics>;

export declare const WINDOW_24H_MS: number;
