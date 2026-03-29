#!/usr/bin/env node
/**
 * install.cjs — MarkOS Interactive Installer & GSD Co-existence Wizard
 * ═══════════════════════════════════════════════════════════════════════════════
 * PURPOSE:
 *   Handles the first-run setup of the MarkOS protocol in a new or existing project.
 *   Ensures parallel co-existence with the `get-shit-done` (GSD) protocol.
 *
 * INSTALLATION FLOW:
 *   1. Detection: Checks for existing GSD or legacy MARKOS-compatible installations in `.agent/`.
 *   2. User Prompt: Asks for installation scope (Project Local vs Global Home).
 *   3. Template Copy: Deep-copies `.agent/markos/` templates.
 *   4. GSD Integration: If GSD exists, merges ITM templates but keeps files isolated.
 *   5. Vector Boot: Delegates to `bin/ensure-vector.cjs` to validate vector providers.
 *   6. Manifest: Writes `.markos-install-manifest.json` for idempotent updates later.
 *
 * COMMANDS:
 *   npx markos                    → runs interactive install
 *   npx markos update             → delegates to `bin/update.cjs`
 *
 * RELATED FILES:
 *   bin/update.cjs             (Handles idempotent SHA256 patches)
 *   bin/ensure-vector.cjs      (Handles vector memory provider checks)
 *   README.md                  (User-facing install guide)
 * ═══════════════════════════════════════════════════════════════════════════════
 */
'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync, exec } = require('child_process');

// ── Environment Settings ───────────────────────────────────────────────────
const PKG_DIR = path.resolve(__dirname, '..');
const VERSION = fs.readFileSync(path.join(PKG_DIR, '.agent/markos/VERSION'), 'utf8').trim();
const CWD = process.cwd(); // Target project directory
const MIN_NODE_VERSION = '20.16.0';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

/**
 * Prompts the user with a question and returns the answer as a Promise.
 */
const ask = (q) => new Promise(resolve => rl.question(q, resolve));

/**
 * Displays a styled banner in the console.
 */
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
  console.error('  Upgrade Node.js and rerun `npx markos` (or `npx markos update`).\n');
  return false;
}

function applyGitignoreProtections(projectDir) {
  const gitignorePath = path.join(projectDir, '.gitignore');
  const blockStart = '# >>> MarkOS private local artifacts >>>';
  const blockEnd = '# <<< MarkOS private local artifacts <<<';
  const protectedEntries = [
    '.markos-local/',
    '.markos-local/',
    '.markos-install-manifest.json',
    '.markos-install-manifest.json',
    '.markos-project.json',
    '.markos-project.json',
    'onboarding-seed.json',
  ];

  const managedBlock = [
    blockStart,
    '# Auto-managed by MarkOS installer. Keeps private local artifacts out of source control.',
    ...protectedEntries,
    blockEnd,
  ].join('\n');

  const existing = fs.existsSync(gitignorePath)
    ? fs.readFileSync(gitignorePath, 'utf8')
    : '';

  let next = existing;
  let changed = false;

  if (existing.includes(blockStart) && existing.includes(blockEnd)) {
    const blockPattern = new RegExp(`${blockStart}[\\s\\S]*?${blockEnd}`);
    const replacement = managedBlock;
    next = existing.replace(blockPattern, replacement);
    changed = next !== existing;
  } else {
    const hasAllEntries = protectedEntries.every((entry) => existing.includes(entry));
    if (!hasAllEntries) {
      const separator = existing.length > 0 && !existing.endsWith('\n') ? '\n\n' : (existing.length > 0 ? '\n' : '');
      next = `${existing}${separator}${managedBlock}\n`;
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(gitignorePath, next, 'utf8');
  }

  return {
    changed,
    gitignorePath,
  };
}

// ── Detection Logic ────────────────────────────────────────────────────────
/** @returns {boolean} true if GSD protocol is already active in this project */
function detectGSD(targetDir) {
  return fs.existsSync(path.join(targetDir, '.agent', 'get-shit-done', 'VERSION'));
}

/** @returns {boolean} true if the legacy MARKOS-compatible protocol path is already active in this project */
function detectExistingMarkOS(targetDir) {
  return fs.existsSync(path.join(targetDir, '.agent', 'markos', 'VERSION'));
}

function copyRecursive(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (const item of fs.readdirSync(src)) {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    if (fs.statSync(srcPath).isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

async function run() {
  if (!assertSupportedNodeVersion()) {
    rl.close();
    process.exit(1);
  }

  // Handle: npx markos update → defer to update.cjs
  if (process.argv[2] === 'update') {
    require('./update.cjs');
    return;
  }

  banner(`MarkOS Installer v${VERSION} — Marketing Operating System`);

  // Detect GSD
  const hasGSD = detectGSD(CWD);
  const hasMarkOS = detectExistingMarkOS(CWD);

  if (hasMarkOS) {
    console.log(`\n📦 MarkOS is already installed in this project.`);
    const choice = await ask('Run update instead? (y/n): ');
    if (choice.trim().toLowerCase() === 'y') {
      require('./update.cjs');
      rl.close();
      return;
    }
    rl.close();
    return;
  }

  if (hasGSD) {
    console.log('\n✓ Existing GSD install detected — MarkOS will be added alongside it.');
  } else {
    console.log('\nℹ No GSD install found — MarkOS will be installed standalone.');
  }

  // Step 1: Install location
  console.log('\n[1/5] Install location');
  console.log('  1) This project only (.agent/ in current directory)');
  console.log('  2) Global (~/.agent/)');
  const locChoice = await ask('Choice (1 or 2): ');
  const isGlobal = locChoice.trim() === '2';
  const os = require('os');
  const targetDir = isGlobal ? os.homedir() : CWD;
  const agentDir = path.join(targetDir, '.agent');

  // Step 2: Project name
  console.log('\n[2/5] Project marketing context');
  const projectName = await ask('Project/client name for this MarkOS install: ');

  // Step 3: Launch onboarding?
  console.log('\n[3/5] Client intelligence onboarding');
  console.log('  Launch the MarkOS onboarding flow to generate RESEARCH/, MIR/, MSP/ automatically?');
  const launchOnboarding = await ask('Launch onboarding form after install? (y/n): ');

  // Step 4: Confirm
  console.log('\n[4/5] Summary');
  console.log(`  Install to: ${agentDir}`);
  console.log(`  Project: ${projectName}`);
  console.log(`  GSD co-existence: ${hasGSD ? 'Yes (non-destructive)' : 'N/A'}`);
  console.log(`  Onboarding: ${launchOnboarding.trim().toLowerCase() === 'y' ? 'Yes' : 'Skip'}`);
  const confirm = await ask('\nProceed? (y/n): ');

  if (confirm.trim().toLowerCase() !== 'y') {
    console.log('\nInstallation cancelled.');
    rl.close();
    return;
  }

  // Step 5: Install
  banner('Installing MarkOS...');

  const markosSrc = path.join(PKG_DIR, '.agent', 'markos');
  const markosDest = path.join(agentDir, 'markos');
  copyRecursive(markosSrc, markosDest);
  console.log('✓ MarkOS protocol files installed (.agent/markos path)');

  // Copy onboarding
  const onboardingSrc = path.join(PKG_DIR, 'onboarding');
  const onboardingDest = path.join(CWD, 'onboarding');
  if (!fs.existsSync(onboardingDest)) {
    copyRecursive(onboardingSrc, onboardingDest);
    console.log('✓ Onboarding app installed');
  }

  // Write VERSION
  fs.writeFileSync(path.join(markosDest, 'VERSION'), VERSION);

  // Write install manifest
  const manifestPath = path.join(CWD, '.markos-install-manifest.json');
  
  // Build file hash manifest for accurate conflict detection during updates
  function buildFileHashes(dir, baseDir = dir, hashes = {}) {
    for (const item of fs.readdirSync(dir)) {
      const full = path.join(dir, item);
      const rel = path.relative(baseDir, full);
      if (fs.statSync(full).isDirectory()) {
        buildFileHashes(full, baseDir, hashes);
      } else {
        hashes[rel] = require('crypto').createHash('sha256').update(fs.readFileSync(full)).digest('hex');
      }
    }
    return hashes;
  }

  const manifest = {
    version: VERSION,
    installed: new Date().toISOString(),
    location: isGlobal ? 'global' : 'project',
    project_name: projectName,
    file_hashes: buildFileHashes(markosDest)
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('✓ Install manifest written (.markos-install-manifest.json)');

  const gitignoreResult = applyGitignoreProtections(CWD);
  if (gitignoreResult.changed) {
    console.log('✓ .gitignore updated with private local artifact protections');
  }

  // Non-destructive GSD append (if GSD detected)
  if (hasGSD) {
    const markosSkillsDir = path.join(agentDir, 'markos', 'skills');
    // Skills already in correct place — just confirm
    console.log('✓ MarkOS skills co-exist with GSD (no conflicts)');
  }

  // Append to GEMINI.md / CLAUDE.md if present (never overwrite)
  // TODO(MARKOS-LEGACY-PATH-MIGRATION): Keep legacy protocol path references
  // until directory/index migration to `.agent/markos` and `MARKOS-INDEX.md` is completed.
  for (const aiMd of ['GEMINI.md', 'CLAUDE.md', 'AGENTS.md']) {
    const aiMdPath = path.join(CWD, aiMd);
    if (fs.existsSync(aiMdPath)) {
      const existing = fs.readFileSync(aiMdPath, 'utf8');
      if (!existing.includes('MarkOS')) {
        fs.appendFileSync(aiMdPath, `\n\n## MarkOS — Marketing Operating System\n\nMarkOS protocol installed at \`.agent/markos/\`.\nSee \`.agent/markos/MARKOS-INDEX.md\` for full documentation.\n`);
        console.log(`✓ MarkOS section appended to ${aiMd}`);
      }
    }
  }

  banner(`MarkOS v${VERSION} installed ✓`);
  console.log(`\n  Protocol: ${markosDest}`);
  console.log(`  Update:   npx markos update`);
  // Keep this docs path aligned with current runtime filesystem layout.
  console.log(`  Docs:     .agent/markos/MARKOS-INDEX.md\n`);

  if (launchOnboarding.trim().toLowerCase() === 'y') {
    // ── 1. Interactive .env Setup ───────────────────────────────────────────
    const envPath = path.join(CWD, '.env');
    let hasKeys = false;
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      if (envContent.includes('OPENAI_API_KEY') || 
          envContent.includes('ANTHROPIC_API_KEY') || 
          envContent.includes('GEMINI_API_KEY')) {
        hasKeys = true;
      }
    }

    if (!hasKeys) {
      console.log('\n[!] No AI Keys detected in .env');
      console.log('To power the MarkOS AI agents, you need at least one API key.');
      console.log('  1) OpenAI');
      console.log('  2) Anthropic');
      console.log('  3) Google Gemini');
      console.log('  4) Skip for now (will fail to generate AI drafts)');
      
      const providerChoice = await ask('Select provider (1-4): ');
      
      let keyFormat = '';
      if (providerChoice.trim() === '1') {
        const key = await ask('Paste OPENAI_API_KEY (sk-...): ');
        if (key) keyFormat = `\nOPENAI_API_KEY=${key.trim()}\nOPENAI_MODEL=gpt-4o-mini\n`;
      } else if (providerChoice.trim() === '2') {
        const key = await ask('Paste ANTHROPIC_API_KEY (sk-ant-...): ');
        if (key) keyFormat = `\nANTHROPIC_API_KEY=${key.trim()}\nANTHROPIC_MODEL=claude-3-5-haiku-20241022\n`;
      } else if (providerChoice.trim() === '3') {
        const key = await ask('Paste GEMINI_API_KEY (AIza...): ');
        if (key) keyFormat = `\nGEMINI_API_KEY=${key.trim()}\nGEMINI_MODEL=gemini-2.5-flash\n`;
      }

      if (keyFormat) {
        fs.appendFileSync(envPath, keyFormat);
        console.log('✓ API Key saved to .env securely.');
      }
    }

    // ── 2. Vector Memory Daemon ─────────────────────────────────────────────
    const { ensureVectorStores } = require('./ensure-vector.cjs');
    await ensureVectorStores();

    // ── 3. Server Handoff ───────────────────────────────────────────────────
    console.log('\n🚀 Starting MarkOS Orchestrator Sequence...\n');
    rl.close();
    
    // Redirect to V2 Server
    require(path.join(CWD, 'onboarding', 'backend', 'server.cjs'));

  } else {
    console.log('Run `node onboarding/backend/server.cjs` to fully launch the system later.\n');
    rl.close();
  }
}

run().catch(e => { console.error(e); rl.close(); process.exit(1); });
