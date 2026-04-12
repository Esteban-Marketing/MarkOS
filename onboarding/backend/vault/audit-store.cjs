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
    return createInMemoryAuditStore();
  }

  if (options.supabase) {
    return createSupabaseAuditStore({
      supabase: options.supabase,
      tableName: options.tableName,
    });
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
    return createSupabaseAuditStore({
      supabase: client,
      tableName: options.tableName,
    });
  }

  return createInMemoryAuditStore();
}

const runtimeStore = createAuditStore();

async function append(entry) {
  return runtimeStore.append(entry);
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
  getAll,
  size,
  clear,
  createAuditStore,
};
