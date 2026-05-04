'use strict';

const { createHmac, randomBytes, timingSafeEqual } = require('node:crypto');
const { FRESHNESS_WINDOW_SECONDS, isStaleTimestamp } = require('./replay-protection.cjs');

const SIGNATURE_HEADER = 'X-Markos-Signature';
const TIMESTAMP_HEADER = 'X-Markos-Timestamp';
const SIGNATURE_PREFIX = 'sha256=';
const MAX_SKEW_SECONDS = FRESHNESS_WINDOW_SECONDS;
const NONCE_BYTES = 16;

function resolveUnixSeconds(now = Date.now) {
  const raw = typeof now === 'function' ? now() : now;
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    if (raw > 1_000_000_000_000) return Math.floor(raw / 1000);
    return Math.floor(raw);
  }
  return Math.floor(Date.now() / 1000);
}

function normalizeTimestamp(timestamp, fallbackNow = Date.now) {
  if (timestamp == null || timestamp === '') return resolveUnixSeconds(fallbackNow);
  const asNumber = Number(timestamp);
  if (!Number.isFinite(asNumber)) throw new Error('sign: timestamp must be numeric');
  if (asNumber > 1_000_000_000_000) return Math.floor(asNumber / 1000);
  return Math.floor(asNumber);
}

function normalizeNonce(nonce) {
  if (nonce == null || nonce === '') return randomBytes(NONCE_BYTES).toString('hex');
  return String(nonce).toLowerCase();
}

function buildStructuredDigest(secret, timestamp, nonce, body) {
  return createHmac('sha256', secret)
    .update(`${timestamp}.${nonce}.${body}`)
    .digest('hex');
}

function signPayload(secret, body, now = Date.now) {
  if (!secret) throw new Error('signPayload: secret is required');
  const timestamp = resolveUnixSeconds(now).toString();
  const signedInput = `${timestamp}.${body}`;
  const digest = createHmac('sha256', secret).update(signedInput).digest('hex');
  return { signature: `${SIGNATURE_PREFIX}${digest}`, timestamp };
}

function sign(secret, body, options = {}) {
  if (!secret) throw new Error('sign: secret is required');
  const timestamp = normalizeTimestamp(options.timestamp, options.now);
  const nonce = normalizeNonce(options.nonce);
  const digest = buildStructuredDigest(secret, timestamp, nonce, body);
  return `t=${timestamp},n=${nonce},sha256=${digest}`;
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

function parseSignatureHeader(header) {
  if (typeof header !== 'string' || !header.trim()) {
    return { ok: false, reason: 'malformed_signature' };
  }

  const parts = header
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length < 3) {
    return { ok: false, reason: 'malformed_signature' };
  }

  const map = Object.create(null);
  for (const part of parts) {
    const splitAt = part.indexOf('=');
    if (splitAt <= 0) {
      return { ok: false, reason: 'malformed_signature' };
    }
    const key = part.slice(0, splitAt);
    const value = part.slice(splitAt + 1);
    if (!value || Object.prototype.hasOwnProperty.call(map, key)) {
      return { ok: false, reason: 'malformed_signature' };
    }
    map[key] = value;
  }

  if (!Object.prototype.hasOwnProperty.call(map, 't')) {
    return { ok: false, reason: 'malformed_signature' };
  }
  if (!/^-?\d+$/.test(map.t)) {
    return { ok: false, reason: 'malformed_timestamp' };
  }
  if (!Object.prototype.hasOwnProperty.call(map, 'n') || !/^[a-f0-9]{32}$/i.test(map.n)) {
    return { ok: false, reason: 'malformed_signature' };
  }
  if (!Object.prototype.hasOwnProperty.call(map, 'sha256') || !/^[a-f0-9]{64}$/i.test(map.sha256)) {
    return { ok: false, reason: 'malformed_signature' };
  }

  const timestamp = Number.parseInt(map.t, 10);
  if (!Number.isFinite(timestamp)) {
    return { ok: false, reason: 'malformed_timestamp' };
  }

  return {
    ok: true,
    t: timestamp,
    n: map.n.toLowerCase(),
    sha256: map.sha256.toLowerCase(),
  };
}

async function verify(secret, body, signatureHeader, options = {}) {
  if (!secret) return { ok: false, reason: 'signature_mismatch' };

  const parsed = parseSignatureHeader(signatureHeader);
  if (!parsed.ok) return parsed;

  if (isStaleTimestamp(parsed.t, options.now)) {
    return { ok: false, reason: 'stale_timestamp', detail: String(parsed.t) };
  }

  const expected = buildStructuredDigest(secret, parsed.t, parsed.n, body);
  const provided = parsed.sha256;
  if (expected.length !== provided.length) {
    return { ok: false, reason: 'signature_mismatch' };
  }

  const expectedBuffer = Buffer.from(expected, 'hex');
  const providedBuffer = Buffer.from(provided, 'hex');
  if (expectedBuffer.length !== providedBuffer.length) {
    return { ok: false, reason: 'signature_mismatch' };
  }
  if (!timingSafeEqual(expectedBuffer, providedBuffer)) {
    return { ok: false, reason: 'signature_mismatch' };
  }

  let recordResult = { ok: true };
  if (typeof options.recordNonce === 'function') {
    recordResult = await options.recordNonce(parsed.n, parsed.t);
  } else if (options.client && options.subscriptionId) {
    const { recordNonce } = require('./replay-protection.cjs');
    recordResult = await recordNonce(options.client, options.subscriptionId, parsed.n);
  }

  if (!recordResult || recordResult.ok !== true) {
    return {
      ok: false,
      reason: recordResult?.reason || 'replay',
      detail: recordResult?.detail,
    };
  }

  return { ok: true, timestamp: String(parsed.t), nonce: parsed.n };
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
  NONCE_BYTES,
  sign,
  signPayload,
  signPayloadDualSign,
  parseSignatureHeader,
  verify,
  verifySignature,
};
