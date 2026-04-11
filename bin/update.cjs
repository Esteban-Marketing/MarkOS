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

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const os = require('node:os');
const readline = require('node:readline');
const {
  assertSupportedNodeVersion,
  banner,
  buildFileHashes,
  isInteractiveSession,
  parseCliArgs,
  printInstallUsage,
} = require('./cli-runtime.cjs');

// ── Environment Settings ───────────────────────────────────────────────────
const PKG_DIR = path.resolve(__dirname, '..');
const CWD = process.cwd();
const NEW_VERSION = fs.readFileSync(path.join(PKG_DIR, '.agent/markos/VERSION'), 'utf8').trim();
const VAULT_ROOT_NAME = 'MarkOS-Vault';
const VAULT_FAMILIES = ['Home', 'Strategy', 'Execution', 'Relationships', 'Evidence', 'Reviews', 'Memory'];
const PROFILE_SCHEMA_VERSION = 1;

function isValidProfile(profile) {
  return profile === 'full' || profile === 'cli' || profile === 'minimal';
}

function buildProfileComponents(profile, previousComponents = null) {
  const defaults = {
    onboarding_enabled: profile === 'full',
    ui_enabled: profile === 'full',
  };

  if (!previousComponents || typeof previousComponents !== 'object') {
    return defaults;
  }

  return {
    onboarding_enabled: typeof previousComponents.onboarding_enabled === 'boolean' ? previousComponents.onboarding_enabled : defaults.onboarding_enabled,
    ui_enabled: typeof previousComponents.ui_enabled === 'boolean' ? previousComponents.ui_enabled : defaults.ui_enabled,
  };
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(resolve => rl.question(q, resolve));

function toPortablePath(value) {
  return String(value).split(path.sep).join('/');
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

function writeFileIfMissing(filePath, content) {
  if (fs.existsSync(filePath)) {
    return false;
  }

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
  return true;
}

function normalizeVaultManifest(manifest) {
  const projectSlug = typeof manifest?.project_slug === 'string' && manifest.project_slug.trim()
    ? manifest.project_slug.trim()
    : 'markos-client';
  const projectName = typeof manifest?.project_name === 'string' && manifest.project_name.trim()
    ? manifest.project_name.trim()
    : 'MarkOS Project';

  const installProfile = isValidProfile(manifest?.install_profile) ? manifest.install_profile : 'full';

  return {
    ...manifest,
    manifest_schema_version: Math.max(Number(manifest?.manifest_schema_version || 0), 2),
    project_name: projectName,
    project_slug: projectSlug,
    bootstrap_model: manifest?.bootstrap_model || 'vault-first',
    legacy_surface_policy: manifest?.legacy_surface_policy || 'migration-only',
    install_profile: installProfile,
    profile_schema_version: Math.max(Number(manifest?.profile_schema_version || 0), PROFILE_SCHEMA_VERSION),
    components: buildProfileComponents(installProfile, manifest?.components),
    vault_root: toPortablePath(manifest?.vault_root || VAULT_ROOT_NAME),
    vault_home_note: toPortablePath(manifest?.vault_home_note || `${VAULT_ROOT_NAME}/Home/HOME.md`),
  };
}

function ensureCanonicalVaultContinuity(manifest) {
  const normalizedManifest = normalizeVaultManifest(manifest);
  const vaultRoot = path.join(CWD, normalizedManifest.vault_root);
  const homeNotePath = path.join(CWD, normalizedManifest.vault_home_note);
  const createdPaths = [];

  if (!fs.existsSync(vaultRoot)) {
    fs.mkdirSync(vaultRoot, { recursive: true });
    createdPaths.push(vaultRoot);
  }

  for (const family of VAULT_FAMILIES) {
    const familyDir = path.join(vaultRoot, family);
    if (!fs.existsSync(familyDir)) {
      fs.mkdirSync(familyDir, { recursive: true });
      createdPaths.push(familyDir);
    }
  }

  const obsidianDir = path.join(vaultRoot, '.obsidian');
  if (!fs.existsSync(obsidianDir)) {
    fs.mkdirSync(obsidianDir, { recursive: true });
    createdPaths.push(obsidianDir);
  }

  if (writeFileIfMissing(path.join(obsidianDir, 'app.json'), JSON.stringify({ alwaysUpdateLinks: true }, null, 2))) {
    createdPaths.push(path.join(obsidianDir, 'app.json'));
  }

  const vaultReadme = `# MarkOS Vault\n\nThis Obsidian vault is the canonical MarkOS operating surface for ${normalizedManifest.project_name}.\n\n## Canonical Families\n\n- Home\n- Strategy\n- Execution\n- Relationships\n- Evidence\n- Reviews\n- Memory\n\n## Update Continuity\n\nThis scaffold is preserved by \`npx markos update\` as the canonical vault-first workspace. Legacy MIR/MSP surfaces remain migration-only and are not recreated as default update targets.\n`;
  if (writeFileIfMissing(path.join(vaultRoot, 'README.md'), vaultReadme)) {
    createdPaths.push(path.join(vaultRoot, 'README.md'));
  }

  const timestamp = new Date().toISOString();
  const homeNote = `---\nid: home-${normalizedManifest.project_slug}\ntitle: MarkOS Home\nvault_family: Home\nnote_family: home\nstatus: active\nowner: ${normalizedManifest.project_slug}\nreview_cycle: weekly\ncreated_at: ${timestamp}\nupdated_at: ${timestamp}\nsource_mode: native\nsummary: Canonical landing note for the vault-first MarkOS workspace.\n---\n\n# MarkOS Home\n\nUse this vault as the canonical source of truth for strategy, execution, evidence, reviews, relationships, and memory.\n\n## Update Continuity\n\n- Open this folder in Obsidian.\n- Treat legacy MIR/MSP outputs as migration-only surfaces.\n- Use onboarding only as a transitional helper until vault-native writes land.\n`;
  if (writeFileIfMissing(homeNotePath, homeNote)) {
    createdPaths.push(homeNotePath);
  }

  return {
    manifest: normalizedManifest,
    createdPaths,
    vaultRoot,
    homeNotePath,
  };
}

function isLocalOverride(relPath) {
  // Check if the file has a .markos-local/ compatibility override
  const localPath = path.join(CWD, '.markos-local', relPath);
  return fs.existsSync(localPath);
}

function getInstalledDir(manifest) {
  if (!manifest) return null;
  const isGlobal = manifest.location === 'global';
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

function getPkgAgentFiles(pkgAgentDir) {
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

  return walkDir(pkgAgentDir);
}

async function resolveConflict(conflict, isInteractive) {
  console.log(`  ┌─ ${conflict.relPath}`);
  const oldContent = fs.readFileSync(conflict.installedPath, 'utf8');
  const newContent = fs.readFileSync(conflict.newPath, 'utf8');
  console.log(simpleDiff(oldContent, newContent));
  console.log('  └─────');

  if (!isInteractive) {
    console.log('    → Non-interactive mode: keeping your version');
    return false;
  }

  const choice = await ask(`\n  [K]eep mine / [T]ake update / [S]kip: `);
  if (choice.trim().toLowerCase() === 't') {
    fs.copyFileSync(conflict.newPath, conflict.installedPath);
    console.log('    → Update applied');
    return true;
  }
  if (choice.trim().toLowerCase() === 'k') {
    console.log('    → Keeping your version');
    return false;
  }

  console.log('    → Skipped (no change)');
  return false;
}

function applyPackageUpdates(newFiles, pkgAgentDir, installedDir, manifest) {
  let applied = 0;
  let skippedOverride = 0;
  const conflicts = [];

  for (const relPath of newFiles) {
    const installedPath = path.join(installedDir, relPath);
    const newPath = path.join(pkgAgentDir, relPath);

    if (isLocalOverride(relPath)) {
      skippedOverride++;
      continue;
    }

    const newHash = hashFile(newPath);
    const installedHash = hashFile(installedPath);
    if (newHash === installedHash) {
      continue;
    }

    if (!installedHash) {
      fs.mkdirSync(path.dirname(installedPath), { recursive: true });
      fs.copyFileSync(newPath, installedPath);
      applied++;
      continue;
    }

    const installTimeHash = manifest.file_hashes?.[relPath];
    if (installTimeHash && installedHash !== installTimeHash) {
      conflicts.push({ relPath, installedPath, newPath });
      continue;
    }

    fs.mkdirSync(path.dirname(installedPath), { recursive: true });
    fs.copyFileSync(newPath, installedPath);
    applied++;
  }

  return { applied, skippedOverride, conflicts };
}

async function run() {
  const cli = parseCliArgs();
  if (cli.help) {
    printInstallUsage();
    rl.close();
    return;
  }

  if (!assertSupportedNodeVersion('npx markos update')) {
    rl.close();
    process.exit(1);
  }

  const isInteractive = isInteractiveSession();

  banner(`MarkOS Update Engine v${NEW_VERSION}`);
  console.log(`\n  Mode: ${isInteractive ? 'interactive' : 'non-interactive'}`);

  const manifest = readManifest();
  if (!manifest) {
    console.error('\n✗ No .markos-install-manifest.json found. Run `npx markos` to install first.');
    rl.close();
    process.exit(1);
  }

  const vaultContinuity = ensureCanonicalVaultContinuity(manifest);
  const normalizedManifest = vaultContinuity.manifest;

  const installedVersion = normalizedManifest.version;
  console.log(`\n  Installed: v${installedVersion}`);
  console.log(`  Latest:    v${NEW_VERSION}`);
  console.log(`  Canonical vault: ${path.join(CWD, normalizedManifest.vault_root)}`);
  if (vaultContinuity.createdPaths.length > 0) {
    console.log(`  Vault continuity: repaired ${vaultContinuity.createdPaths.length} canonical asset(s)`);
  }

  if (installedVersion === NEW_VERSION) {
    console.log('\n✓ Already up to date.\n');
    rl.close();
    return;
  }

  const installedDir = getInstalledDir(normalizedManifest);
  if (!installedDir || !fs.existsSync(installedDir)) {
    console.error(`\n✗ Installed MarkOS directory not found: ${installedDir}`);
    rl.close();
    process.exit(1);
  }

  const pkgAgentDir = path.join(PKG_DIR, '.agent', 'markos');
  const newFiles = getPkgAgentFiles(pkgAgentDir);

  console.log(`\n  Scanning ${newFiles.length} files for changes...\n`);
  let { applied, skippedOverride, conflicts } = applyPackageUpdates(newFiles, pkgAgentDir, installedDir, normalizedManifest);

  console.log(`  ✓ Applied: ${applied} files updated`);
  console.log(`  ⊘ Skipped: ${skippedOverride} files (.markos-local/ compatibility override active)`);

  if (conflicts.length > 0) {
    console.log(`\n  ⚠ ${conflicts.length} conflict(s) — both you and the update changed these files:\n`);

    for (const conflict of conflicts) {
      const tookUpdate = await resolveConflict(conflict, isInteractive);
      if (tookUpdate) {
        applied++;
      }
    }
  }

  // Update VERSION and manifest
  fs.writeFileSync(path.join(installedDir, 'VERSION'), NEW_VERSION);
  const newManifest = {
    ...normalizedManifest,
    version: NEW_VERSION,
    last_updated: new Date().toISOString(),
    previous_version: installedVersion,
    file_hashes: buildFileHashes(installedDir),
  };
  fs.writeFileSync(path.join(CWD, '.markos-install-manifest.json'), JSON.stringify(newManifest, null, 2));

  banner(`MarkOS updated to v${NEW_VERSION} ✓`);
  console.log(`  ${applied} file(s) updated | ${skippedOverride} override(s) preserved\n`);
  console.log('  Canonical vault continuity preserved; legacy MIR/MSP surfaces remain migration-only.\n');
  rl.close();
}

run().catch(e => { console.error(e); rl.close(); process.exit(1); });
