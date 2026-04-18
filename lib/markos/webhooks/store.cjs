'use strict';

// Phase 203 Plan 01 Task 1 — webhook store factory with mode switch (memory ↔ supabase).
// Replaces the 200-03 in-memory singleton with a lazily-constructed Supabase + Vercel Queues
// adapter set. Defaults to supabase mode in production; memory mode preserved verbatim for
// local runs + test regression (WEBHOOK_STORE_MODE=memory OR missing SUPABASE env → memory).
//
// T-203-01-05 mitigation: memory mode is local-only; production ALWAYS sets
// WEBHOOK_STORE_MODE=supabase (see 203-01-PLAN.md user_setup). Tests explicitly pass
// { mode: 'memory' } when they need deterministic in-process state.
//
// Pitfall 1 (RESEARCH §Pitfall 1): process-local Maps silently lose data on Fluid Compute
// instance turnover. Supabase is authoritative in supabase mode.
// Pitfall 6 (RESEARCH §Pitfall 6): service-role client ALWAYS instantiated with
// { auth: { persistSession: false } } so RLS is bypassed cleanly without a user JWT.

const { createInMemoryStore } = require('./engine.cjs');
const { createInMemoryDeliveryStore, createInMemoryQueue } = require('./delivery.cjs');

// ---------------------------------------------------------------------------
// Module-scope caches (memoized per mode). All 6 cleared by _resetWebhookStoresForTests.
// ---------------------------------------------------------------------------
let _subscriptionsMemo = null;
let _deliveriesMemo = null;
let _queueMemo = null;

let _supaSubs = null;
let _supaDels = null;
let _supaQueue = null;
let _supaClient = null;

// Track the current effective mode for cache invalidation (if a caller flips modes via deps,
// we re-resolve the appropriate cache; same-mode re-calls always return the singleton).
let _lastMode = null;

function resolveMode(deps) {
  if (deps?.mode) return deps.mode;
  if (process.env.WEBHOOK_STORE_MODE) return process.env.WEBHOOK_STORE_MODE;
  // Default: supabase in production, but gracefully degrade to memory when the required env
  // vars are absent (local dev, CI without secrets, tests). This preserves 200-03 regression
  // without requiring tests to set WEBHOOK_STORE_MODE=memory explicitly.
  const hasSupabaseEnv = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
  return hasSupabaseEnv ? 'supabase' : 'memory';
}

function createServiceRoleClient() {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('store.cjs: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY required for supabase mode');
  }
  // Lazy require so test runs without @supabase/supabase-js wired (shouldn't happen — dep exists)
  // and so bundle cost only lands on production cold-start.
  const { createClient } = require('@supabase/supabase-js');
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
    db: { schema: 'public' },
  });
}

function getMemoryStores() {
  if (!_subscriptionsMemo) _subscriptionsMemo = createInMemoryStore();
  if (!_deliveriesMemo) _deliveriesMemo = createInMemoryDeliveryStore();
  if (!_queueMemo) _queueMemo = createInMemoryQueue();
  return {
    subscriptions: _subscriptionsMemo,
    deliveries: _deliveriesMemo,
    queue: _queueMemo,
  };
}

function getSupabaseStores(deps) {
  const {
    createSupabaseSubscriptionsStore,
    createSupabaseDeliveriesStore,
  } = require('./store-supabase.cjs');

  if (!_supaClient) {
    _supaClient = deps?.supabase || createServiceRoleClient();
  }
  if (!_supaSubs) _supaSubs = createSupabaseSubscriptionsStore(_supaClient);
  if (!_supaDels) _supaDels = createSupabaseDeliveriesStore(_supaClient);
  if (!_supaQueue) {
    if (deps?.queue) {
      _supaQueue = deps.queue;
    } else {
      // Lazy require store-vercel-queue — Task 2 provides it. Safe-require so Task 1 tests
      // can run before Task 2 lands.
      try {
        const { createVercelQueueClient } = require('./store-vercel-queue.cjs');
        _supaQueue = createVercelQueueClient({ topic: 'markos-webhook-delivery' });
      } catch (err) {
        // Graceful degrade: if @vercel/queue missing or adapter not installed yet, expose a
        // push-only stub that throws loudly on invocation (never silent drop).
        const reason = err?.message || String(err);
        _supaQueue = {
          push(delivery_id) {
            throw new Error(
              `store.cjs: markos-webhook-delivery queue adapter unavailable (wanted delivery_id=${delivery_id}; cause: ${reason}). ` +
                'Install @vercel/queue and ensure store-vercel-queue.cjs exists.',
            );
          },
        };
      }
    }
  }
  return {
    subscriptions: _supaSubs,
    deliveries: _supaDels,
    queue: _supaQueue,
  };
}

function getWebhookStores(deps) {
  const mode = resolveMode(deps);
  if (mode !== _lastMode) {
    // Mode changed — do NOT reset the OTHER mode's caches; just resolve the current mode's stores.
    _lastMode = mode;
  }
  if (mode === 'memory') return getMemoryStores();
  if (mode === 'supabase') return getSupabaseStores(deps || {});
  throw new Error(`store.cjs: unknown WEBHOOK_STORE_MODE='${mode}' (expected 'memory' or 'supabase')`);
}

function _resetWebhookStoresForTests() {
  _subscriptionsMemo = null;
  _deliveriesMemo = null;
  _queueMemo = null;
  _supaSubs = null;
  _supaDels = null;
  _supaQueue = null;
  _supaClient = null;
  _lastMode = null;
}

module.exports = {
  getWebhookStores,
  _resetWebhookStoresForTests,
};
