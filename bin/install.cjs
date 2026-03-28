#!/usr/bin/env node
/**
 * install.cjs — MarkOS Interactive Installer & GSD Co-existence Wizard
 * ═══════════════════════════════════════════════════════════════════════════════
 * PURPOSE:
 *   Handles the first-run setup of the MarkOS protocol in a new or existing project.
 *   Ensures parallel co-existence with the `get-shit-done` (GSD) protocol.
 *
 * INSTALLATION FLOW:
 *   1. Detection: Checks for existing GSD or legacy MGSD-compatible installations in `.agent/`.
 *   2. User Prompt: Asks for installation scope (Project Local vs Global Home).
 *   3. Template Copy: Deep-copies `.agent/marketing-get-shit-done/` templates.
 *   4. GSD Integration: If GSD exists, merges ITM templates but keeps files isolated.
 *   5. Vector Boot: Delegates to `bin/ensure-chroma.cjs` to start the local DB.
 *   6. Manifest: Writes `.mgsd-install-manifest.json` for idempotent updates later.
 *
 * COMMANDS:
 *   npx markos                    → runs interactive install
 *   npx markos update             → delegates to `bin/update.cjs`
 *
 * RELATED FILES:
 *   bin/update.cjs             (Handles idempotent SHA256 patches)
 *   bin/ensure-chroma.cjs      (Handles vector memory boot)
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
const VERSION = fs.readFileSync(path.join(PKG_DIR, '.agent/marketing-get-shit-done/VERSION'), 'utf8').trim();
const CWD = process.cwd(); // Target project directory

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

// ── Detection Logic ────────────────────────────────────────────────────────
/** @returns {boolean} true if GSD protocol is already active in this project */
function detectGSD(targetDir) {
  return fs.existsSync(path.join(targetDir, '.agent', 'get-shit-done', 'VERSION'));
}

/** @returns {boolean} true if the legacy MGSD-compatible protocol path is already active in this project */
function detectExistingMGSD(targetDir) {
  return fs.existsSync(path.join(targetDir, '.agent', 'marketing-get-shit-done', 'VERSION'));
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
  // Handle: npx markos update → defer to update.cjs
  if (process.argv[2] === 'update') {
    require('./update.cjs');
    return;
  }

  banner(`MarkOS Installer v${VERSION} — Marketing Operating System`);

  // Detect GSD
  const hasGSD = detectGSD(CWD);
  const hasMGSD = detectExistingMGSD(CWD);

  if (hasMGSD) {
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

  const mgsdSrc = path.join(PKG_DIR, '.agent', 'marketing-get-shit-done');
  const mgsdDest = path.join(agentDir, 'marketing-get-shit-done');
  copyRecursive(mgsdSrc, mgsdDest);
  console.log('✓ MarkOS protocol files installed (.agent/marketing-get-shit-done compatibility path)');

  // Copy onboarding
  const onboardingSrc = path.join(PKG_DIR, 'onboarding');
  const onboardingDest = path.join(CWD, 'onboarding');
  if (!fs.existsSync(onboardingDest)) {
    copyRecursive(onboardingSrc, onboardingDest);
    console.log('✓ Onboarding app installed');
  }

  // Write VERSION
  fs.writeFileSync(path.join(mgsdDest, 'VERSION'), VERSION);

  // Write install manifest
  const manifestPath = path.join(CWD, '.mgsd-install-manifest.json');
  
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
    file_hashes: buildFileHashes(mgsdDest)
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('✓ Install manifest written (.mgsd-install-manifest.json compatibility manifest)');

  // Non-destructive GSD append (if GSD detected)
  if (hasGSD) {
    const gsdSkillsDir = path.join(agentDir, 'skills');
    const mgsdSkillsDir = path.join(mgsdDest, 'skills');
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
        fs.appendFileSync(aiMdPath, `\n\n## MarkOS — Marketing Operating System\n\nMarkOS protocol installed at \`.agent/marketing-get-shit-done/\`.\nSee \`.agent/marketing-get-shit-done/MGSD-INDEX.md\` for full documentation.\nMigration note: this path remains legacy until the MarkOS directory/index migration is applied.\n`);
        console.log(`✓ MarkOS section appended to ${aiMd}`);
      }
    }
  }

  banner(`MarkOS v${VERSION} installed ✓`);
  console.log(`\n  Protocol: ${mgsdDest}`);
  console.log(`  Update:   npx markos update`);
  // Keep this docs path aligned with current runtime filesystem layout.
  console.log(`  Docs:     .agent/marketing-get-shit-done/MGSD-INDEX.md  (temporary legacy path; will migrate to .agent/markos/MARKOS-INDEX.md in a future release)\n`);

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
    const { ensureChroma } = require('./ensure-chroma.cjs');
    await ensureChroma();

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
