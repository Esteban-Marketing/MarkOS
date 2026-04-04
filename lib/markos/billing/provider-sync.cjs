'use strict';

function deriveProviderSyncOutcome({ line_items = [], provider = 'stripe', sync_status = 'pending', failure_code = null } = {}) {
  const hasFailure = sync_status === 'failed';

  return Object.freeze({
    provider,
    sync_status,
    billing_state: hasFailure ? 'hold' : 'active',
    reason_code: hasFailure ? failure_code : null,
    read_access_preserved: true,
    restricted_actions: hasFailure ? ['execute_task', 'write_campaigns'] : [],
    hold_history: hasFailure
      ? [{ provider, failure_code, line_item_count: Array.isArray(line_items) ? line_items.length : 0 }]
      : [],
  });
}

module.exports = {
  deriveProviderSyncOutcome,
};