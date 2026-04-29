'use strict';

// Phase 201.1 D-107 (closes M2): BYOD soft-failure grace window helpers.
//
// When markos_custom_domains.status transitions verified->failed (cert expiry, DNS drift),
// middleware still serves the tenant for up to 24h after the last successful verification.
// The grace window is stored in last_verified_at (added by migration 97).
//
// Grace path can be disabled via env: MARKOS_BYOD_GRACE_DISABLED=1 (operations escape hatch).

const BYOD_GRACE_WINDOW_MS = 86_400_000; // 24 hours

/**
 * Returns true if grace is enabled (env flag not set to '1').
 */
function gracePathEnabled() {
  return process.env.MARKOS_BYOD_GRACE_DISABLED !== '1';
}

/**
 * Returns true iff the given domain row qualifies for the 24h grace window.
 *
 * @param {object} row - A markos_custom_domains row (must have .status and .last_verified_at).
 * @param {number} [now] - Current epoch ms (injectable for testing). Defaults to Date.now().
 * @returns {boolean}
 */
function isWithinByodGraceWindow(row, now) {
  if (!gracePathEnabled()) return false;
  if (!row || row.status !== 'failed') return false;
  if (!row.last_verified_at) return false;

  let lastVerifiedMs;
  if (typeof row.last_verified_at === 'string') {
    lastVerifiedMs = new Date(row.last_verified_at).getTime();
  } else if (row.last_verified_at && typeof row.last_verified_at.getTime === 'function') {
    lastVerifiedMs = row.last_verified_at.getTime();
  } else {
    lastVerifiedMs = 0;
  }

  if (!Number.isFinite(lastVerifiedMs) || lastVerifiedMs <= 0) return false;

  const delta = (typeof now === 'number' ? now : Date.now()) - lastVerifiedMs;
  return delta < BYOD_GRACE_WINDOW_MS;
}

module.exports = { BYOD_GRACE_WINDOW_MS, gracePathEnabled, isWithinByodGraceWindow };
