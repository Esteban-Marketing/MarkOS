#!/usr/bin/env node
/**
 * ensure-chroma.cjs — Auto-Healing ChromaDB Daemon
 * ═══════════════════════════════════════════════════════════════════════════════
 * PURPOSE:
 *   Ensures a local ChromaDB vector database is running before any agent or
 *   server attempts to read/write vector memory. Called at boot time by:
 *     - bin/install.cjs  (after first install)
 *     - onboarding/backend/server.cjs  (before HTTP server starts listening)
 *
 * BEHAVIOR:
 *   1. Reads .env — if CHROMA_CLOUD_URL is set, skips local daemon entirely.
 *   2. Pings localhost:8000/api/v1/heartbeat with a 500ms timeout.
 *   3. If alive → returns immediately.
 *   4. If dead → spawns `python -m chromadb.cli.cli run` as a detached background
 *      daemon (unref'd so it outlives the Node process).
 *   5. Waits 2 seconds for the daemon to become ready before resolving.
 *
 * EXPORTS:
 *   ensureChroma() → Promise<boolean>  (true = ready, false = could not start)
 *
 * CLI USAGE:
 *   node bin/ensure-chroma.cjs   →  exits 0 once DB is confirmed ready
 *
 * RELATED FILES:
 *   .env                                         (CHROMA_CLOUD_URL check)
 *   onboarding/backend/chroma-client.cjs         (HTTP API surface)
 *   .mgsd-project.json                           (project_slug for collection namespace)
 *   .protocol-lore/MEMORY.md                     (vector memory architecture)
 * ═══════════════════════════════════════════════════════════════════════════════
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

/**
 * Ensures ChromaDB is running. Resolves once the database is accessible.
 *
 * Priority:
 *  1. CHROMA_CLOUD_URL in .env → use cloud, skip local daemon entirely
 *  2. localhost:8000 alive → nothing to do
 *  3. localhost:8000 dead → spawn detached python daemon, wait 2s, resolve
 *
 * @returns {Promise<boolean>} true if DB is accessible, false if startup failed
 */
async function ensureChroma() {
  const CWD = process.cwd();
  const envPath = path.join(CWD, '.env');

  // ── Step 1: Check for cloud override ───────────────────────────────────────
  // If the user has configured a remote ChromaDB, nothing to do locally.
  let useCloudChroma = false;
  if (fs.existsSync(envPath)) {
    const activeEnv = fs.readFileSync(envPath, 'utf8');
    if (activeEnv.match(/^CHROMA_CLOUD_URL=http/m)) {
      useCloudChroma = true;
    }
  }

  if (useCloudChroma) {
    return true; // Cloud is managed externally — no local daemon needed
  }

  // ── Step 2: Ping local heartbeat endpoint ──────────────────────────────────
  // 500ms timeout prevents hanging when daemon is completely absent.
  const isAlive = await new Promise((resolve) => {
    const req = http.get('http://localhost:8000/api/v1/heartbeat', (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));        // Connection refused → dead
    req.setTimeout(500, () => resolve(false));    // Timeout → assume dead
  });

  if (isAlive) {
    return true; // ChromaDB is already running — nothing to start
  }

  // ── Step 3: Spawn detached Python daemon ───────────────────────────────────
  // detached: true  → daemon keeps running after this Node process exits
  // stdio: 'ignore' → suppress daemon output in parent terminal
  // unref()         → parent does not wait for this child to exit
  console.log('\n[>] Reviving Vector Memory (ChromaDB) in background...');
  try {
    const pyCmd = process.platform === 'win32' ? 'python' : 'python3';
    const chromaProcess = spawn(pyCmd, ['-m', 'chromadb.cli.cli', 'run'], {
      detached: true,
      stdio: 'ignore'
    });
    chromaProcess.unref();

    // Wait 2 seconds for the daemon to finish booting before the caller
    // makes any Chroma HTTP requests. Without this wait, the first API
    // calls would fail with ECONNREFUSED during the daemon startup window.
    await new Promise(r => setTimeout(r, 2000));
    return true;
  } catch (err) {
    // Python is not installed or chromadb package is missing.
    // Inform the user and fall through gracefully — do not crash.
    console.log('⚠ Could not start ChromaDB automatically. You may need to run: python -m chromadb.cli.cli run');
    return false;
  }
}

module.exports = { ensureChroma };

// ── CLI entry point ────────────────────────────────────────────────────────────
// Allows running this script directly: `node bin/ensure-chroma.cjs`
// Useful for health checks in shell scripts or CI pipelines.
if (require.main === module) {
  ensureChroma().then(() => process.exit(0));
}
