#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

/**
 * Ensures ChromaDB is running locally.
 * 1. Checks for CHROMA_CLOUD_URL in .env (skips local boot)
 * 2. Pings local heartbeat /api/v1/heartbeat
 * 3. Boots python daemon if dead
 */
async function ensureChroma() {
  const CWD = process.cwd();
  const envPath = path.join(CWD, '.env');
  
  let useCloudChroma = false;
  if (fs.existsSync(envPath)) {
    const activeEnv = fs.readFileSync(envPath, 'utf8');
    if (activeEnv.match(/^CHROMA_CLOUD_URL=http/m)) {
      useCloudChroma = true;
    }
  }

  if (useCloudChroma) {
    return true; // Cloud is managed externally
  }

  // Ping heartbeat
  const isAlive = await new Promise((resolve) => {
    const req = http.get('http://localhost:8000/api/v1/heartbeat', (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(500, () => resolve(false));
  });

  if (isAlive) {
    return true; // Already running
  }

  console.log('\n[>] Reviving Vector Memory (ChromaDB) in background...');
  try {
    const pyCmd = process.platform === 'win32' ? 'python' : 'python3';
    const chromaProcess = spawn(pyCmd, ['-m', 'chromadb.cli.cli', 'run'], {
      detached: true,
      stdio: 'ignore'
    });
    chromaProcess.unref();
    
    // Wait for boot to finish so the following requests don't fail
    await new Promise(r => setTimeout(r, 2000));
    return true;
  } catch (err) {
    console.log('⚠ Could not start ChromaDB automatically. You may need to run: python -m chromadb.cli.cli run');
    return false;
  }
}

module.exports = { ensureChroma };

// Allow direct execution from CLI
if (require.main === module) {
  ensureChroma().then(() => process.exit(0));
}
