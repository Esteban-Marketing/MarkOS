'use strict';

const { createHmac, timingSafeEqual } = require('node:crypto');

const SIGNATURE_HEADER = 'X-Markos-Signature';
const TIMESTAMP_HEADER = 'X-Markos-Timestamp';
const SIGNATURE_PREFIX = 'sha256=';
const MAX_SKEW_SECONDS = 300;

function signPayload(secret, body, now = Date.now) {
  if (!secret) throw new Error('signPayload: secret is required');
  const timestamp = Math.floor(now() / 1000).toString();
  const signedInput = `${timestamp}.${body}`;
  const digest = createHmac('sha256', secret).update(signedInput).digest('hex');
  return { signature: `${SIGNATURE_PREFIX}${digest}`, timestamp };
}

// Plan 203-04 Task 1 — dual-sign foundation for Plan 203-05 rotation grace window (D-10).
// When a rotation is active, outbound webhooks must carry BOTH V1 (current) AND V2 (new) signatures so
// subscribers can verify with either secret during the 30-day overlap. Stripe pattern. The caller passes
// v2Secret=null when no rotation is active — only V1 + Timestamp are returned.
//
// Shape matches 203-RESEARCH.md §Pattern 3 lines 349-365 verbatim. Header names use X-Markos-Signature-V1
// and X-Markos-Signature-V2 (mirroring the existing X-Markos-Signature convention but suffixed per-version).
function signPayloadDualSign(v1Secret, v2Secret, body, now = Date.now) {
  if (!v1Secret) throw new Error('signPayloadDualSign: v1Secret is required');
  const { signature: sig1, timestamp } = signPayload(v1Secret, body, now);
  const headers = {
    'X-Markos-Signature-V1': sig1,
    'X-Markos-Timestamp': String(timestamp),
  };
  if (!v2Secret) return { headers };
  const digest2 = createHmac('sha256', v2Secret).update(`${timestamp}.${body}`).digest('hex');
  headers['X-Markos-Signature-V2'] = `${SIGNATURE_PREFIX}${digest2}`;
  return { headers };
}

function verifySignature(secret, body, signature, timestamp, options = {}) {
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

module.exports = {
  SIGNATURE_HEADER,
  TIMESTAMP_HEADER,
  SIGNATURE_PREFIX,
  MAX_SKEW_SECONDS,
  signPayload,
  signPayloadDualSign,
  verifySignature,
};
