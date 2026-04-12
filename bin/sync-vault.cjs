#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const crypto = require('node:crypto');
const path = require('path');

const { createIngestRouter } = require('../onboarding/backend/vault/ingest-router.cjs');
const { createSyncOrchestrator } = require('../onboarding/backend/vault/sync-orchestrator.cjs');
const { createIngestApply } = require('../onboarding/backend/vault/ingest-apply.cjs');
const { createAuditLog } = require('../onboarding/backend/vault/audit-log.cjs');
const { createReindexQueue } = require('../onboarding/backend/pageindex/reindex-queue.cjs');
const { createReindexDispatch } = require('../onboarding/backend/pageindex/reindex-dispatch.cjs');
const auditStore = require('../onboarding/backend/vault/audit-store.cjs');
const { parseFrontmatter, extractAudienceMetadata } = require('../onboarding/backend/vault/frontmatter-parser.cjs');
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

  function readMetadata(targetPath) {
    try {
      const content = fs.readFileSync(targetPath, 'utf8');
      const fm = parseFrontmatter(content);
      const audienceMetadata = extractAudienceMetadata(fm);
      // Derive a stable content_hash from the file body — required by buildIdempotencyKey.
      const contentHash = crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);
      return { ...audienceMetadata, content_hash: contentHash };
    } catch (_err) {
      return {};
    }
  }

  watcher.on('add', (targetPath) => {
    const metadata = readMetadata(targetPath);
    orchestrator.handleFsEvent('add', targetPath, { metadata });
  });
  watcher.on('change', (targetPath) => {
    const metadata = readMetadata(targetPath);
    orchestrator.handleFsEvent('change', targetPath, { metadata });
  });
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

  if (options.router) {
    // Caller-injected router (test seam)
    const router = options.router;
    const orchestrator = createSyncOrchestrator({
      tenantId,
      vaultRoot,
      enqueue: async (event) => router.route({ event }),
    });
    const watcherFactory = options.watcherFactory || loadChokidar();
    const watcher = createWatcher(orchestrator, watcherFactory, vaultRoot);
    return { tenantId, vaultRoot, watcher, close: async () => watcher.close() };
  }

  // ── Production pipeline wiring ─────────────────────────────────────────────
  // In-memory revision store (Phase 85 scope; persistent store deferred to Phase 86+)
  const activeRevisions = new Map();
  const getActiveRevision = async ({ tenantId: tid, docId }) =>
    activeRevisions.get(`${tid}:${docId}`) || null;
  const upsertRevision = async ({ revision }) => {
    activeRevisions.set(`${revision.tenant_id}:${revision.doc_id}`, revision);
    return revision;
  };

  const ingestApply = createIngestApply({ getActiveRevision, upsertRevision });

  const auditLog = createAuditLog({
    append: async (entry) => auditStore.append(entry),
  });

  // No-op PageIndex dispatch for Phase 85 (real dispatch wired in Phase 86+ retrieval layer)
  const reindexDispatch = createReindexDispatch({
    reindexDocument: async () => ({ acknowledged: true, lane: 'phase86-deferred' }),
  });
  const reindexQueue = createReindexQueue({ dispatch: (job) => reindexDispatch.dispatch(job) });

  const router = createIngestRouter({
    applyIngest: (payload) => ingestApply.apply(payload),
    appendAudit: (entry) => auditLog.append(entry),
    enqueueReindex: (payload) => reindexQueue.enqueue({
      tenantId: payload.event && payload.event.tenant_id,
      docId: payload.event && payload.event.doc_id,
      idempotencyKey: payload.idempotencyKey,
      reason: 'change',
      observedAt: payload.event && payload.event.observed_at,
    }),
    // indexArtifact is required by the router contract even when enqueueReindex is provided
    indexArtifact: async () => ({ ok: true, lane: 'reindex-queued' }),
  });

  const orchestrator = createSyncOrchestrator({
    tenantId,
    vaultRoot,
    enqueue: async (event) => {
      const result = await router.route({ event });
      // Drain the reindex queue after each ingest so jobs execute promptly.
      await reindexQueue.drain();
      return result;
    },
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
