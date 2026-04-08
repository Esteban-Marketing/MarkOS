'use strict';

const { buildEntitlementSnapshot } = require('./entitlements.cjs');

function normalizeEntries(value) {
  return Array.isArray(value) ? value.slice() : [];
}

function buildSyncAttempt({
  sync_attempt_id,
  tenant_id,
  provider,
  sync_status,
  reason_code,
  billing_period_start,
  billing_period_end,
  synced_at,
  line_item_count,
}) {
  return Object.freeze({
    sync_attempt_id,
    tenant_id,
    provider,
    sync_status,
    reason_code: reason_code || null,
    billing_period_start,
    billing_period_end,
    synced_at,
    line_item_count,
    billing_truth_source: 'markos-ledger',
  });
}

function buildHoldEvent({
  hold_event_id,
  tenant_id,
  provider,
  billing_period_start,
  billing_period_end,
  event_type,
  hold_state,
  reason_code,
  sync_attempt_id,
  released_by_sync_attempt_id,
  created_at,
  released_at = null,
  line_item_count = 0,
}) {
  return Object.freeze({
    hold_event_id,
    tenant_id,
    provider,
    billing_period_start,
    billing_period_end,
    event_type,
    hold_state,
    reason_code: reason_code || null,
    sync_attempt_id: sync_attempt_id || null,
    released_by_sync_attempt_id: released_by_sync_attempt_id || null,
    line_item_count,
    created_at,
    released_at,
    billing_truth_source: 'markos-ledger',
  });
}

function buildActiveSnapshot({ tenant_id, billing_period_start, billing_period_end }) {
  return buildEntitlementSnapshot({
    tenant_id,
    billing_period_start,
    billing_period_end,
    status: 'active',
    restricted_actions: [],
    restricted_capabilities: [],
    reason_code: null,
  });
}

function buildHeldSnapshot({ tenant_id, billing_period_start, billing_period_end, reason_code }) {
  return buildEntitlementSnapshot({
    tenant_id,
    billing_period_start,
    billing_period_end,
    status: 'hold',
    restricted_actions: ['execute_task', 'write_campaigns'],
    restricted_capabilities: ['publish_campaigns'],
    reason_code: reason_code || 'BILLING_HOLD_ACTIVE',
  });
}

function deriveProviderSyncOutcome({
  line_items = [],
  provider = 'stripe',
  sync_status = 'pending',
  failure_code = null,
  tenant_id = 'tenant-alpha-001',
  billing_period_start = '2026-04-01T00:00:00.000Z',
  billing_period_end = '2026-04-30T23:59:59.999Z',
  sync_attempt_id = null,
  synced_at = '2026-04-03T18:30:00.000Z',
  previous_sync_attempts = [],
  hold_history = [],
  active_hold = null,
} = {}) {
  const normalizedLineItems = normalizeEntries(line_items);
  const normalizedAttempts = normalizeEntries(previous_sync_attempts);
  const normalizedHoldHistory = normalizeEntries(hold_history);
  const resolvedSyncAttemptId = sync_attempt_id || `sync-attempt-${provider}-${sync_status}-${normalizedAttempts.length + 1}`;
  const syncAttempt = buildSyncAttempt({
    sync_attempt_id: resolvedSyncAttemptId,
    tenant_id,
    provider,
    sync_status,
    reason_code: failure_code,
    billing_period_start,
    billing_period_end,
    synced_at,
    line_item_count: normalizedLineItems.length,
  });
  const syncAttempts = Object.freeze([...normalizedAttempts, syncAttempt]);

  if (sync_status === 'failed') {
    const holdEvent = buildHoldEvent({
      hold_event_id: `hold-event-${resolvedSyncAttemptId}`,
      tenant_id,
      provider,
      billing_period_start,
      billing_period_end,
      event_type: active_hold ? 'hold_extended' : 'hold_opened',
      hold_state: 'hold',
      reason_code: failure_code,
      sync_attempt_id: resolvedSyncAttemptId,
      created_at: synced_at,
      line_item_count: normalizedLineItems.length,
    });
    const fullHoldHistory = Object.freeze([...normalizedHoldHistory, holdEvent]);
    const holdInterval = Object.freeze({
      ...holdEvent,
      active: true,
    });
    const currentSnapshot = buildHeldSnapshot({
      tenant_id,
      billing_period_start,
      billing_period_end,
      reason_code: failure_code,
    });

    return Object.freeze({
      provider,
      sync_status,
      billing_state: 'hold',
      reason_code: failure_code,
      read_access_preserved: true,
      restricted_actions: currentSnapshot.restricted_actions,
      sync_attempt: syncAttempt,
      sync_attempts: syncAttempts,
      hold_history: fullHoldHistory,
      hold_interval: holdInterval,
      release_event: null,
      current_snapshot: currentSnapshot,
      restored_snapshot: null,
      recovery_state: 'held',
      billing_period_start,
      billing_period_end,
    });
  }

  const matchingActiveHold = active_hold?.tenant_id === tenant_id
    && active_hold?.billing_period_start === billing_period_start
    && active_hold?.billing_period_end === billing_period_end
    && !active_hold?.released_at;
  const releaseEvent = matchingActiveHold
    ? buildHoldEvent({
        hold_event_id: `hold-release-${resolvedSyncAttemptId}`,
        tenant_id,
        provider,
        billing_period_start,
        billing_period_end,
        event_type: 'hold_released',
        hold_state: 'released',
        reason_code: matchingActiveHold.reason_code,
        sync_attempt_id: matchingActiveHold.sync_attempt_id,
        released_by_sync_attempt_id: resolvedSyncAttemptId,
        created_at: synced_at,
        released_at: synced_at,
        line_item_count: normalizedLineItems.length,
      })
    : null;
  const fullHoldHistory = Object.freeze(releaseEvent
    ? [...normalizedHoldHistory, releaseEvent]
    : normalizedHoldHistory);
  const currentSnapshot = buildActiveSnapshot({
    tenant_id,
    billing_period_start,
    billing_period_end,
  });

  return Object.freeze({
    provider,
    sync_status,
    billing_state: 'active',
    reason_code: null,
    read_access_preserved: true,
    restricted_actions: [],
    sync_attempt: syncAttempt,
    sync_attempts: syncAttempts,
    hold_history: fullHoldHistory,
    hold_interval: matchingActiveHold
      ? Object.freeze({
          ...matchingActiveHold,
          hold_state: 'released',
          released_at: synced_at,
          active: false,
        })
      : null,
    release_event: releaseEvent,
    current_snapshot: currentSnapshot,
    restored_snapshot: releaseEvent ? currentSnapshot : null,
    recovery_state: releaseEvent ? 'released' : 'active',
    billing_period_start,
    billing_period_end,
  });
}

module.exports = {
  deriveBillingSyncOutcome: deriveProviderSyncOutcome,
  deriveProviderSyncOutcome,
};