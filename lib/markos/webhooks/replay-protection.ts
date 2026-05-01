const impl = require('./replay-protection.cjs');

export const FRESHNESS_WINDOW_SECONDS: number = impl.FRESHNESS_WINDOW_SECONDS;

export type RecordNonceResult =
  | { ok: true }
  | { ok: false; reason: string; detail?: string };

export type ReplayProtectionVerifyOptions = {
  now?: number | (() => number);
  recordNonce?: (nonce: string) => Promise<RecordNonceResult> | RecordNonceResult;
  client?: { from: (table: string) => { insert: (row: Record<string, unknown>) => Promise<{ error?: { code?: string; message?: string } | null }> } };
  subscriptionId?: string;
};

export const recordNonce: (
  client: { from: (table: string) => { insert: (row: Record<string, unknown>) => Promise<{ error?: { code?: string; message?: string } | null }> } },
  subscriptionId: string,
  nonce: string,
) => Promise<RecordNonceResult> = impl.recordNonce;

export const isStaleTimestamp: (timestampSeconds: number, now?: number | (() => number)) => boolean = impl.isStaleTimestamp;
export const verifySignatureWithReplayProtection: (
  secret: string,
  body: string,
  signatureHeader: string,
  options?: ReplayProtectionVerifyOptions,
) => Promise<{ ok: true; timestamp: string; nonce: string } | { ok: false; reason: string; detail?: string }> = impl.verifySignatureWithReplayProtection;

export default impl;
