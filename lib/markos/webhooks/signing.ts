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
