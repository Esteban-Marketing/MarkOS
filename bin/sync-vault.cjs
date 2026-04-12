#!/usr/bin/env node
'use strict';

const path = require('path');

const { createIngestRouter } = require('../onboarding/backend/vault/ingest-router.cjs');
const { createSyncOrchestrator } = require('../onboarding/backend/vault/sync-orchestrator.cjs');

function loadChokidar() {
  try {
    return require('chokidar');
  } catch (error) {
    const wrapped = new Error('chokidar is required to run sync-vault watcher.');
    wrapped.code = 'E_SYNC_CHOKIDAR_MISSING';
    wrapped.cause = error;
    throw wrapped;
  }
}

function parseArgs(argv) {
  const values = {
    vaultRoot: process.env.MARKOS_VAULT_ROOT || '.',
    tenantId: process.env.MARKOS_TENANT_ID || 'default',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--vault-root') {
      values.vaultRoot = argv[index + 1] || values.vaultRoot;
      index += 1;
      continue;
    }

    if (token === '--tenant') {
      values.tenantId = argv[index + 1] || values.tenantId;
      index += 1;
    }
  }

  return values;
}

function createWatcher(orchestrator, watcherFactory, vaultRoot) {
  const watcher = watcherFactory.watch(vaultRoot, {
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 400, pollInterval: 100 },
    atomic: true,
  });

  watcher.on('add', (targetPath) => orchestrator.handleFsEvent('add', targetPath));
  watcher.on('change', (targetPath) => orchestrator.handleFsEvent('change', targetPath));
  watcher.on('unlink', (targetPath) => orchestrator.handleFsEvent('unlink', targetPath));

  return watcher;
}

async function startVaultSync(options = {}) {
  const tenantId = String(options.tenantId || '').trim();
  const vaultRoot = path.resolve(String(options.vaultRoot || '.'));
  if (!tenantId) {
    const error = new Error('tenant id is required');
    error.code = 'E_SYNC_TENANT_REQUIRED';
    throw error;
  }

  const router = options.router || createIngestRouter({
    persistArtifact: async () => ({ ok: true, lane: 'baseline-persist' }),
    indexArtifact: async () => ({ ok: true, lane: 'baseline-index' }),
  });

  const orchestrator = createSyncOrchestrator({
    tenantId,
    vaultRoot,
    enqueue: async (event) => router.route({ event }),
  });

  const watcherFactory = options.watcherFactory || loadChokidar();
  const watcher = createWatcher(orchestrator, watcherFactory, vaultRoot);

  return {
    tenantId,
    vaultRoot,
    watcher,
    close: async () => watcher.close(),
  };
}

module.exports = {
  startVaultSync,
  parseArgs,
};

if (require.main === module) {
  const args = parseArgs(process.argv.slice(2));
  startVaultSync(args)
    .then(({ tenantId, vaultRoot }) => {
      console.log(`[sync-vault] watching ${vaultRoot} for tenant ${tenantId}`);
    })
    .catch((error) => {
      console.error(`[sync-vault] failed: ${error.code || 'E_SYNC_FAILED'} ${error.message}`);
      process.exit(1);
    });
}
