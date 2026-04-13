'use strict';

const {
  createInMemoryAuditStore,
  createSupabaseAuditStore,
} = require('./supabase-audit-store.cjs');

function hasSupabaseConfig() {
  const url = String(process.env.SUPABASE_URL || '').trim();
  const key = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  return Boolean(url && key);
}

function createAuditStore(options = {}) {
  const mode = String(options.mode || '').trim();
  if (mode === 'in-memory') {
    const memoryStore = createInMemoryAuditStore();
    memoryStore.__durable = false;
    return memoryStore;
  }

  if (options.supabase) {
    const supabaseStore = createSupabaseAuditStore({
      supabase: options.supabase,
      tableName: options.tableName,
    });
    supabaseStore.__durable = true;
    return supabaseStore;
  }

  if (hasSupabaseConfig()) {
    let createClient = null;
    try {
      ({ createClient } = require('@supabase/supabase-js'));
    } catch (error) {
      return createInMemoryAuditStore();
    }

    const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
      },
    });
    const supabaseStore = createSupabaseAuditStore({
      supabase: client,
      tableName: options.tableName,
    });
    supabaseStore.__durable = true;
    return supabaseStore;
  }

  const memoryStore = createInMemoryAuditStore();
  memoryStore.__durable = false;
  return memoryStore;
}

const runtimeStore = createAuditStore();

function isDurableStore(store = runtimeStore) {
  return Boolean(store && store.__durable === true);
}

async function append(entry) {
  return runtimeStore.append(entry);
}

async function appendClosureRecord(entry, options = {}) {
  const store = options.store || runtimeStore;
  const requireDurable = options.requireDurable !== false;
  if (requireDurable && !isDurableStore(store)) {
    const error = new Error('Durable governance persistence is required for closure records.');
    error.code = 'E_AUDIT_DURABLE_REQUIRED';
    throw error;
  }

  return store.append({
    ...entry,
    type: 'milestone_closure_bundle',
  });
}

async function getAll(filter) {
  return runtimeStore.getAll(filter);
}

async function size() {
  return runtimeStore.size();
}

async function clear() {
  return runtimeStore.clear();
}

module.exports = {
  append,
  appendClosureRecord,
  getAll,
  size,
  clear,
  createAuditStore,
  isDurableStore,
};
