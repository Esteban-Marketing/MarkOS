#!/usr/bin/env node
/**
 * update.cjs — MarkOS Safe Update & Patch Engine
 * ═══════════════════════════════════════════════════════════════════════════════
 * PURPOSE:
 *   Applies updates from the MarkOS package to a project while preserving client
 *   modifications and `.markos-local/` compatibility overrides. Idempotent and SHA256-safe.
 *
 * UPDATE FLOW:
 *   1. Local Manifest Check: Reads `.markos-install-manifest.json` for current state.
 *   2. File Scan: Compares every file in the package to the installed version.
 *   3. Override Protection: Skips any file that has a corresponding `.markos-local/` override.
 *   4. Conflict Detection:
 *        - If installed hash === manifest hash: Update is safe (no client edits).
 *        - If installed hash !== manifest hash: Client modified the file.
 *        - If client modified AND update changed: Prompt for diff resolution.
 *   5. Simple Diff: Shows a line-level comparison for conflicted files.
 *   6. Version Step: Updates `VERSION` and manifest `last_updated` timestamp.
 *
 * RELATED FILES:
 *   bin/install.cjs                       (Created the initial manifest)
 *   .markos-install-manifest.json          (Source of truth for file hashes)
 *   .markos-local/                         (The compatibility override layer that update never touches)
 * ═══════════════════════════════════════════════════════════════════════════════
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');

// ── Environment Settings ───────────────────────────────────────────────────
const PKG_DIR = path.resolve(__dirname, '..');
const CWD = process.cwd();
const NEW_VERSION = fs.readFileSync(path.join(PKG_DIR, '.agent/markos/VERSION'), 'utf8').trim();
const MIN_NODE_VERSION = '20.16.0';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(resolve => rl.question(q, resolve));

function banner(text) {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(` ${text}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

function compareSemver(a, b) {
  const pa = String(a).split('.').map((part) => Number.parseInt(part, 10) || 0);
  const pb = String(b).split('.').map((part) => Number.parseInt(part, 10) || 0);
  const max = Math.max(pa.length, pb.length);
  for (let i = 0; i < max; i++) {
    const left = pa[i] || 0;
    const right = pb[i] || 0;
    if (left > right) return 1;
    if (left < right) return -1;
  }
  return 0;
}

function getEffectiveNodeVersion() {
  return process.env.MARKOS_NODE_VERSION_OVERRIDE || process.versions.node;
}

function assertSupportedNodeVersion() {
  const nodeVersion = getEffectiveNodeVersion();
  if (compareSemver(nodeVersion, MIN_NODE_VERSION) >= 0) {
    return true;
  }

  console.error('\n✗ MarkOS requires Node.js >= 20.16.0.');
  console.error(`  Current version: ${nodeVersion}`);
  console.error('  Upgrade Node.js and rerun `npx markos update`.\n');
  return false;
}

function hashFile(filePath) {
  try {
    return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
  } catch { return null; }
}

function readManifest() {
  const manifestPath = path.join(CWD, '.markos-install-manifest.json');
  try {
    return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch { return null; }
}

function isLocalOverride(relPath) {
  // Check if the file has a .markos-local/ compatibility override
  const localPath = path.join(CWD, '.markos-local', relPath);
  return fs.existsSync(localPath);
}

function getInstalledDir(manifest) {
  if (!manifest) return null;
  const isGlobal = manifest.location === 'global';
  const os = require('os');
  const baseDir = isGlobal ? os.homedir() : CWD;
  return path.join(baseDir, '.agent', 'markos');
}

function simpleDiff(oldContent, newContent) {
  // Simple line-level diff output
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');
  const result = [];
  const maxLen = Math.max(oldLines.length, newLines.length);
  for (let i = 0; i < Math.min(maxLen, 20); i++) { // show first 20 diff lines
    if (oldLines[i] !== newLines[i]) {
      if (oldLines[i] !== undefined) result.push(`  - ${oldLines[i]}`);
      if (newLines[i] !== undefined) result.push(`  + ${newLines[i]}`);
    }
  }
  return result.length > 0 ? result.join('\n') : '  (binary or complex diff)';
}

async function run() {
  if (!assertSupportedNodeVersion()) {
    rl.close();
    process.exit(1);
  }

  banner(`MarkOS Update Engine v${NEW_VERSION}`);

  const manifest = readManifest();
  if (!manifest) {
    console.error('\n✗ No .markos-install-manifest.json found. Run `npx markos` to install first.');
    rl.close();
    return;
  }

  const installedVersion = manifest.version;
  console.log(`\n  Installed: v${installedVersion}`);
  console.log(`  Latest:    v${NEW_VERSION}`);

  if (installedVersion === NEW_VERSION) {
    console.log('\n✓ Already up to date.\n');
    rl.close();
    return;
  }

  const installedDir = getInstalledDir(manifest);
  if (!installedDir || !fs.existsSync(installedDir)) {
    console.error(`\n✗ Installed MarkOS directory not found: ${installedDir}`);
    rl.close();
    return;
  }

  const pkgAgentDir = path.join(PKG_DIR, '.agent', 'markos');

  // Build file lists
  function walkDir(dir, baseDir = dir, list = []) {
    for (const item of fs.readdirSync(dir)) {
      const full = path.join(dir, item);
      const rel = path.relative(baseDir, full);
      if (fs.statSync(full).isDirectory()) {
        walkDir(full, baseDir, list);
      } else {
        list.push(rel);
      }
    }
    return list;
  }

  const newFiles = walkDir(pkgAgentDir);

  let applied = 0, skippedOverride = 0, conflicts = [];

  console.log(`\n  Scanning ${newFiles.length} files for changes...\n`);

  for (const relPath of newFiles) {
    const installedPath = path.join(installedDir, relPath);
    const newPath = path.join(pkgAgentDir, relPath);

    // Skip if .markos-local/ override exists for this file
    if (isLocalOverride(relPath)) {
      skippedOverride++;
      continue;
    }

    const newHash = hashFile(newPath);
    const installedHash = hashFile(installedPath);

    // Unchanged files: skip
    if (newHash === installedHash) continue;

    // File is new (doesn't exist in installed): safe to add
    if (!installedHash) {
      fs.mkdirSync(path.dirname(installedPath), { recursive: true });
      fs.copyFileSync(newPath, installedPath);
      applied++;
      continue;
    }

    // File exists in both: check if client modified it since install
    // We detect modification by comparing against install-time hash (from manifest file_hashes if present)
    const installTimeHash = manifest.file_hashes?.[relPath];

    if (installTimeHash && installedHash !== installTimeHash) {
      // Client modified this file AND it also changed in the update → CONFLICT
      conflicts.push({ relPath, installedPath, newPath });
      continue;
    }

    // No client modification: safe to update
    fs.mkdirSync(path.dirname(installedPath), { recursive: true });
    fs.copyFileSync(newPath, installedPath);
    applied++;
  }

  console.log(`  ✓ Applied: ${applied} files updated`);
  console.log(`  ⊘ Skipped: ${skippedOverride} files (.markos-local/ compatibility override active)`);

  if (conflicts.length > 0) {
    console.log(`\n  ⚠ ${conflicts.length} conflict(s) — both you and the update changed these files:\n`);

    for (const conflict of conflicts) {
      console.log(`  ┌─ ${conflict.relPath}`);
      const oldContent = fs.readFileSync(conflict.installedPath, 'utf8');
      const newContent = fs.readFileSync(conflict.newPath, 'utf8');
      console.log(simpleDiff(oldContent, newContent));
      console.log('  └─────');

      const choice = await ask(`\n  [K]eep mine / [T]ake update / [S]kip: `);
      if (choice.trim().toLowerCase() === 't') {
        fs.copyFileSync(conflict.newPath, conflict.installedPath);
        applied++;
        console.log('    → Update applied');
      } else if (choice.trim().toLowerCase() === 'k') {
        console.log('    → Keeping your version');
      } else {
        console.log('    → Skipped (no change)');
      }
    }
  }

  // Update VERSION and manifest
  fs.writeFileSync(path.join(installedDir, 'VERSION'), NEW_VERSION);
  const newManifest = {
    ...manifest,
    version: NEW_VERSION,
    last_updated: new Date().toISOString(),
    previous_version: installedVersion
  };
  fs.writeFileSync(path.join(CWD, '.markos-install-manifest.json'), JSON.stringify(newManifest, null, 2));

  banner(`MarkOS updated to v${NEW_VERSION} ✓`);
  console.log(`  ${applied} file(s) updated | ${skippedOverride} override(s) preserved\n`);
  rl.close();
}

run().catch(e => { console.error(e); rl.close(); process.exit(1); });
