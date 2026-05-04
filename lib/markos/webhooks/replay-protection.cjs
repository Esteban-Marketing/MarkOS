'use strict';

// Phase 200.1 D-202: replay protection helpers for webhook signature verification.
// This module is intentionally additive: it supports the nonce-aware verifier path
// without breaking the existing timestamp + sha256 helpers used elsewhere.

const FRESHNESS_WINDOW_SECONDS = 300;

function resolveNowSeconds(now) {
  if (typeof now === 'function') {
    return resolveNowSeconds(now());
  }
  if (typeof now === 'number' && Number.isFinite(now)) {
    if (now > 1_000_000_000_000) return Math.floor(now / 1000);
    return Math.floor(now);
  }
  return Math.floor(Date.now() / 1000);
}

function isDuplicateNonceError(error) {
  const message = String(error?.message || '');
  return error?.code === '23505' || /duplicate key|unique constraint/i.test(message);
}

async function recordNonce(client, subscriptionId, nonce) {
  if (!client || typeof client.from !== 'function') {
    return { ok: false, reason: 'db_error', detail: 'supabase_client_required' };
  }
  if (!subscriptionId) {
    return { ok: false, reason: 'db_error', detail: 'subscription_id_required' };
  }
  if (!nonce) {
    return { ok: false, reason: 'db_error', detail: 'nonce_required' };
  }

  try {
    const result = await client
      .from('markos_webhook_delivery_nonces')
      .insert({ subscription_id: subscriptionId, nonce });
    const error = result?.error || null;
    if (error) {
      if (isDuplicateNonceError(error)) {
        return { ok: false, reason: 'replay', detail: nonce };
      }
      return { ok: false, reason: 'db_error', detail: error.message || String(error) };
    }
    return { ok: true };
  } catch (error) {
    if (isDuplicateNonceError(error)) {
      return { ok: false, reason: 'replay', detail: nonce };
    }
    return {
      ok: false,
      reason: 'db_error',
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}

function isStaleTimestamp(timestampSeconds, now = Date.now()) {
  const ts = Number(timestampSeconds);
  if (!Number.isFinite(ts)) return true;
  return Math.abs(resolveNowSeconds(now) - Math.floor(ts)) > FRESHNESS_WINDOW_SECONDS;
}

async function verifySignatureWithReplayProtection(secret, body, signatureHeader, options = {}) {
  const { verify } = require('./signing.cjs');
  const record = options.recordNonce || (options.client && options.subscriptionId
    ? (nonce) => recordNonce(options.client, options.subscriptionId, nonce)
    : undefined);

  return await verify(secret, body, signatureHeader, {
    now: options.now,
    recordNonce: record,
    subscriptionId: options.subscriptionId,
  });
}

module.exports = {
  FRESHNESS_WINDOW_SECONDS,
  recordNonce,
  isStaleTimestamp,
  verifySignatureWithReplayProtection,
};
