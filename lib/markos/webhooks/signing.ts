import { createHmac, timingSafeEqual } from 'node:crypto';

export const SIGNATURE_HEADER = 'X-Markos-Signature';
export const TIMESTAMP_HEADER = 'X-Markos-Timestamp';
export const SIGNATURE_PREFIX = 'sha256=';
export const MAX_SKEW_SECONDS = 300;

export type SignedPayload = {
  signature: string;
  timestamp: string;
};

export function signPayload(secret: string, body: string, now: () => number = Date.now): SignedPayload {
  if (!secret) throw new Error('signPayload: secret is required');
  const timestamp = Math.floor(now() / 1000).toString();
  const signedInput = `${timestamp}.${body}`;
  const digest = createHmac('sha256', secret).update(signedInput).digest('hex');
  return { signature: `${SIGNATURE_PREFIX}${digest}`, timestamp };
}

// Plan 203-04 Task 1 — dual-sign foundation for Plan 203-05 rotation grace window (D-10).
// When v2Secret=null (no active rotation), only V1 + Timestamp headers are returned.
// When v2Secret is provided, both signatures share the SAME timestamp so subscribers can verify
// against either secret during the 30-day overlap window.
export type DualSignHeaders = {
  'X-Markos-Signature-V1': string;
  'X-Markos-Signature-V2'?: string;
  'X-Markos-Timestamp': string;
};

export function signPayloadDualSign(
  v1Secret: string,
  v2Secret: string | null | undefined,
  body: string,
  now: () => number = Date.now,
): { headers: DualSignHeaders } {
  if (!v1Secret) throw new Error('signPayloadDualSign: v1Secret is required');
  const { signature: sig1, timestamp } = signPayload(v1Secret, body, now);
  const headers: DualSignHeaders = {
    'X-Markos-Signature-V1': sig1,
    'X-Markos-Timestamp': String(timestamp),
  };
  if (!v2Secret) return { headers };
  const digest2 = createHmac('sha256', v2Secret).update(`${timestamp}.${body}`).digest('hex');
  headers['X-Markos-Signature-V2'] = `${SIGNATURE_PREFIX}${digest2}`;
  return { headers };
}

export type VerifyOptions = {
  maxSkewSeconds?: number;
  now?: () => number;
};

export function verifySignature(
  secret: string,
  body: string,
  signature: string,
  timestamp: string,
  options: VerifyOptions = {},
): boolean {
  if (!secret || !signature || !timestamp) return false;
  if (!signature.startsWith(SIGNATURE_PREFIX)) return false;

  const maxSkewSeconds = options.maxSkewSeconds ?? MAX_SKEW_SECONDS;
  const now = options.now ?? Date.now;
  const tsNum = Number.parseInt(timestamp, 10);
  if (!Number.isFinite(tsNum)) return false;

  const skew = Math.abs(Math.floor(now() / 1000) - tsNum);
  if (skew > maxSkewSeconds) return false;

  const expected = createHmac('sha256', secret)
    .update(`${timestamp}.${body}`)
    .digest('hex');
  const provided = signature.slice(SIGNATURE_PREFIX.length);

  if (expected.length !== provided.length) return false;
  return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(provided, 'hex'));
}
