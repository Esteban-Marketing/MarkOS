// Phase 203 Plan 05 Task 1 — Webhook signing-secret rotation orchestrator (TS dual-export stub).
// See rotation.cjs for full behavior contract; this module re-exports the CJS implementation for
// TypeScript/ESM consumers. Matches the webhooks dual-export convention.

// eslint-disable-next-line @typescript-eslint/no-var-requires
const impl = require('./rotation.cjs');

export type RotationStage = 't-7' | 't-1' | 't-0' | 'normal';

export type StartRotationParams = {
  tenant_id: string;
  subscription_id: string;
  actor_id: string;
};

export type StartRotationResult = {
  rotation_id: string;
  grace_ends_at: string;
};

export type RollbackRotationParams = {
  tenant_id: string;
  subscription_id: string;
  actor_id: string;
};

export type ActiveRotation = {
  id: string;
  subscription_id: string;
  url: string | null;
  grace_ends_at: string;
  initiated_at: string;
  stage: RotationStage;
};

export const GRACE_DAYS: number = impl.GRACE_DAYS;

export const startRotation: (client: unknown, params: StartRotationParams) => Promise<StartRotationResult> = impl.startRotation;
export const rollbackRotation: (client: unknown, params: RollbackRotationParams) => Promise<unknown> = impl.rollbackRotation;
export const finalizeExpiredRotations: (client: unknown, now?: string) => Promise<Array<{ subscription_id: string; finalized_at: string }>> = impl.finalizeExpiredRotations;
export const listActiveRotations: (client: unknown, tenant_id: string) => Promise<ActiveRotation[]> = impl.listActiveRotations;
export const computeStage: (grace_ends_at: string | null) => RotationStage = impl.computeStage;
